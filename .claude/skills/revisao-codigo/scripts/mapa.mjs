#!/usr/bin/env node
// Mapa estático de um projeto Scalasys (Next App Router + Supabase).
// Inventário + sinais para orientar a revisão de código. Sem dependências.
//
// Uso:  node mapa.mjs "<pasta do projeto>" [--json <saida.json>] [--dup-min 8]
//
// Os "sinais" são heurísticas de texto: servem para dizer ONDE olhar, nunca
// como achado pronto. Confirme lendo o código antes de escrever no relatório.

import fs from 'node:fs';
import path from 'node:path';

const IGNORAR_DIR = new Set([
  'node_modules', '.next', '.git', '.vercel', '.turbo', '.qa', '.cache', '.claude',
  'dist', 'build', 'out', 'coverage', '__pycache__', '.venv', 'venv',
]);
const EXT_CODIGO = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const EXT_SQL = new Set(['.sql']);

// ---------------------------------------------------------------- argumentos

const argv = process.argv.slice(2);
const raiz = path.resolve(argv.find((a) => !a.startsWith('--')) ?? '.');
const saidaJson = pegarOpcao('--json');
const DUP_MIN = Number(pegarOpcao('--dup-min') ?? 8);

function pegarOpcao(nome) {
  const i = argv.indexOf(nome);
  return i >= 0 ? argv[i + 1] : undefined;
}

if (!fs.existsSync(raiz)) {
  console.error(`Pasta não encontrada: ${raiz}`);
  process.exit(1);
}

// ---------------------------------------------------------------- varredura

const arquivos = [];
(function andar(dir) {
  let entradas;
  try {
    entradas = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entradas) {
    if (e.name.startsWith('.') && e.name !== '.env.example' && !e.isFile()) {
      if (IGNORAR_DIR.has(e.name)) continue;
    }
    const completo = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (IGNORAR_DIR.has(e.name)) continue;
      andar(completo);
    } else if (e.isFile()) {
      const ext = path.extname(e.name);
      if (EXT_CODIGO.has(ext) || EXT_SQL.has(ext)) arquivos.push(completo);
    }
  }
})(raiz);

const rel = (p) => path.relative(raiz, p).split(path.sep).join('/');

const fontes = [];
for (const abs of arquivos) {
  let texto;
  try {
    texto = fs.readFileSync(abs, 'utf8');
  } catch {
    continue;
  }
  const linhas = texto.split(/\r?\n/);
  fontes.push({
    abs,
    rel: rel(abs),
    ext: path.extname(abs),
    texto,
    linhas,
    loc: linhas.length,
    useClient: /^\s*['"]use client['"]/.test(texto),
  });
}

const codigo = fontes.filter((f) => EXT_CODIGO.has(f.ext));
const sql = fontes.filter((f) => EXT_SQL.has(f.ext));

// ---------------------------------------------------------------- inventário

function rotaDe(caminho) {
  // app/(app)/mentorados/page.tsx  ->  /mentorados
  const m = caminho.match(/^(?:src\/)?app\/(.*)\/(page|route)\.(tsx?|jsx?)$/);
  if (!m) return caminho.match(/^(?:src\/)?app\/(page|route)\.(tsx?|jsx?)$/) ? '/' : null;
  const partes = m[1]
    .split('/')
    .filter((p) => !(p.startsWith('(') && p.endsWith(')')))
    .filter((p) => !p.startsWith('@'));
  return '/' + partes.join('/');
}

const rotas = [];
for (const f of codigo) {
  const r = rotaDe(f.rel);
  if (r === null) continue;
  rotas.push({
    rota: r,
    tipo: /\/route\.[jt]sx?$/.test(f.rel) ? 'api' : 'pagina',
    arquivo: f.rel,
    loc: f.loc,
    client: f.useClient,
    dinamica: /\[.+\]/.test(r),
  });
}
rotas.sort((a, b) => a.rota.localeCompare(b.rota));

const porPasta = new Map();
for (const f of codigo) {
  const p = f.rel.split('/').slice(0, 2).join('/');
  porPasta.set(p, (porPasta.get(p) ?? 0) + f.loc);
}

// ---------------------------------------------------------------- schema SQL

const tabelas = new Map(); // nome -> { arquivo, rls, colunas }
const indices = []; // { tabela, colunas, arquivo }
let policies = 0;

for (const f of sql) {
  for (const m of f.texto.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?([\w."]+)\s*\(([\s\S]*?)\n\s*\);/gi)) {
    const nome = limpaIdent(m[1]);
    const corpo = m[2];
    const colunas = [...corpo.matchAll(/^\s{2,}"?([a-z_][\w]*)"?\s+[a-z]/gim)].map((c) => c[1]);
    tabelas.set(nome, { arquivo: f.rel, rls: false, colunas });
  }
  for (const m of f.texto.matchAll(/create\s+(?:unique\s+)?index\s+(?:if\s+not\s+exists\s+)?[\w"]*\s*on\s+([\w."]+)\s*\(([^)]*)\)/gi)) {
    indices.push({
      tabela: limpaIdent(m[1]),
      colunas: m[2].split(',').map((c) => limpaIdent(c.trim().split(/\s/)[0])),
      arquivo: f.rel,
    });
  }
  for (const m of f.texto.matchAll(/alter\s+table\s+([\w."]+)\s+enable\s+row\s+level\s+security/gi)) {
    const nome = limpaIdent(m[1]);
    if (tabelas.has(nome)) tabelas.get(nome).rls = true;
    else tabelas.set(nome, { arquivo: f.rel, rls: true, colunas: [] });
  }
  policies += (f.texto.match(/create\s+policy/gi) ?? []).length;
}

function limpaIdent(s) {
  return s.replace(/"/g, '').replace(/^public\./, '').trim();
}

const colunasIndexadas = new Set(indices.flatMap((i) => i.colunas.map((c) => `${i.tabela}.${c}`)));

// ---------------------------------------------------------------- sinais

const sinais = [];
const add = (tipo, f, linha, trecho, nota) =>
  sinais.push({ tipo, arquivo: f.rel, linha, trecho: (trecho ?? '').trim().slice(0, 140), nota });

const colunasFiltradas = new Map(); // coluna -> [ocorrências]

// Arquivo de linha de comando: imprimir é o trabalho dele, console não é sinal.
const ehCli = (f) => /(^|\/)scripts\//.test(f.rel) || /\.(mjs|cjs)$/.test(f.rel);
// Arquivo de dados (schema JSON, seed, catálogo): repetição ali é esperada.
const ehDados = (f) => {
  const uteis = f.linhas.filter((l) => l.trim().length > 10);
  if (uteis.length < 200) return false;
  const jsonish = uteis.filter((l) => /^\s*["']?[\w-]+["']?\s*:\s*/.test(l) || /^\s*["'][^"']*["'],?\s*$/.test(l));
  return jsonish.length / uteis.length > 0.6;
};

for (const f of codigo) {
  const temSupabase = /supabase|createClient|from\(/.test(f.texto);

  f.linhas.forEach((linha, i) => {
    const n = i + 1;

    if (/\.select\(\s*['"`]\*/.test(linha)) add('select-estrela', f, n, linha);

    if (/const\s*\{[^}]*\bdata\b[^}]*\}\s*=\s*await/.test(linha) && !/\berror\b/.test(linha))
      add('erro-descartado', f, n, linha, 'data sem error na desestruturação');

    if (/await\s+supabase[\s\S]{0,40}$/.test(linha) && !/const|let|var/.test(linha) && /\.(insert|update|delete|upsert)\(/.test(linha))
      add('escrita-sem-retorno', f, n, linha);

    if (/console\.(log|debug|info)\(/.test(linha) && !ehCli(f)) add('console', f, n, linha);
    if (/:\s*any\b|as\s+any\b/.test(linha)) add('any', f, n, linha);
    if (/dangerouslySetInnerHTML/.test(linha)) add('html-cru', f, n, linha);
    if (/\b(TODO|FIXME|XXX|HACK)\b/.test(linha)) add('todo', f, n, linha);
    if (/process\.env\.[A-Z0-9_]+!/.test(linha)) add('env-sem-checagem', f, n, linha);
    if (/toISOString\(\)\s*\.\s*(slice|substring|substr)\(\s*0\s*,\s*10/.test(linha))
      add('data-utc', f, n, linha, 'corta a data em UTC — pode andar um dia no fuso BR');
    if (/catch\s*(\([^)]*\))?\s*\{\s*\}/.test(linha)) add('catch-vazio', f, n, linha);
    if (/(valor|preco|price|amount|total|comissao|mensalidade|desconto)/i.test(linha) && /(parseFloat|Number\()/.test(linha))
      add('dinheiro-float', f, n, linha);
    if (/\.(select|from)\([^)]*\)[\s\S]{0,0}/.test(linha) && /\.length\s*(===|>|<|\)|;|,)/.test(linha) && /data/.test(linha))
      add('contagem-no-cliente', f, n, linha);

    for (const m of linha.matchAll(/\.(eq|order|ilike|gte|lte|lt|gt)\(\s*['"`]([a-z_][\w]*)['"`]/g)) {
      const col = m[2];
      if (!colunasFiltradas.has(col)) colunasFiltradas.set(col, []);
      colunasFiltradas.get(col).push(`${f.rel}:${n}`);
    }

    // await dentro de laço/map: olha adiante enquanto o bloco não fecha
    if (/\.(map|forEach|filter|reduce)\(|^\s*(for|while)\s*\(/.test(linha)) {
      let profundidade = 0;
      let achou = false;
      for (let j = i; j < Math.min(i + 25, f.linhas.length); j++) {
        const l = f.linhas[j];
        profundidade += (l.match(/[({[]/g) ?? []).length - (l.match(/[)}\]]/g) ?? []).length;
        if (j > i && /\bawait\b/.test(l) && /(supabase|fetch\(|\.from\()/.test(l)) achou = true;
        if (j > i && profundidade <= 0) break;
      }
      if (achou) add('await-em-laco', f, n, linha, 'possível N+1: uma ida ao banco por item');
    }

    // dois awaits independentes em sequência
    if (/^\s*(const|let)\s+.*=\s*await\s/.test(linha) && /^\s*(const|let)\s+.*=\s*await\s/.test(f.linhas[i + 1] ?? '')) {
      const nome = linha.match(/(const|let)\s+(\{[^}]*\}|\w+)/)?.[2] ?? '';
      const primeiro = nome.replace(/[{}\s]/g, '').split(',')[0];
      if (primeiro && !(f.linhas[i + 1] ?? '').includes(primeiro))
        add('await-sequencial', f, n, linha, 'talvez caibam num Promise.all');
    }
  });

  if (temSupabase && /\.select\(/.test(f.texto) && !/\.(limit|range|single|maybeSingle)\(/.test(f.texto))
    add('sem-teto', f, 1, '', 'arquivo consulta o banco sem limit/range em nenhum ponto');

  if (/(\.subscribe\(|setInterval\(|addEventListener\()/.test(f.texto) &&
      !/(unsubscribe|removeChannel|clearInterval|removeEventListener)/.test(f.texto))
    add('sem-limpeza', f, 1, '', 'inscrição/timer sem limpeza correspondente');

  if (f.loc > 400) add('arquivo-grande', f, 1, '', `${f.loc} linhas`);
}

// papéis literais espalhados
const PAPEIS = /['"`](Admin|Mentor|Mentorado|Customer Success|Comercial|Gestor|Cliente)['"`]/g;
const papeis = new Map();
for (const f of codigo) {
  for (const m of f.texto.matchAll(PAPEIS)) {
    if (!papeis.has(m[1])) papeis.set(m[1], new Set());
    papeis.get(m[1]).add(f.rel);
  }
}

// colunas filtradas sem índice
const semIndice = [];
for (const [col, ocorrencias] of colunasFiltradas) {
  const cobre = [...colunasIndexadas].some((ci) => ci.endsWith('.' + col));
  const chaveObvia = col === 'id';
  if (!cobre && !chaveObvia && tabelas.size > 0)
    semIndice.push({ coluna: col, ocorrencias: ocorrencias.length, onde: ocorrencias.slice(0, 4) });
}
semIndice.sort((a, b) => b.ocorrencias - a.ocorrencias);

// ---------------------------------------------------------------- duplicação

function normalizar(linha) {
  return linha.replace(/\s+/g, ' ').trim();
}
const RUIDO = /^(import|export\s+(type|\{)|\/\/|\/\*|\*|})/;

const mantidas = new Map(); // arquivo -> [{ norm, linha }]
const dadosIgnorados = [];
for (const f of codigo) {
  if (ehDados(f)) {
    dadosIgnorados.push(f.rel);
    continue;
  }
  const arr = [];
  f.linhas.forEach((l, i) => {
    const n = normalizar(l);
    if (n.length < 15 || RUIDO.test(n)) return;
    arr.push({ norm: n, linha: i + 1 });
  });
  mantidas.set(f.rel, arr);
}

const janelas = new Map(); // hash -> [{arquivo, idx}]
for (const [arquivo, arr] of mantidas) {
  for (let i = 0; i + DUP_MIN <= arr.length; i++) {
    const chave = arr.slice(i, i + DUP_MIN).map((x) => x.norm).join('\n');
    if (!janelas.has(chave)) janelas.set(chave, []);
    janelas.get(chave).push({ arquivo, idx: i });
  }
}

const consumido = new Set(); // `${arquivo}:${idx}`
const duplicados = [];
for (const [, ocs] of janelas) {
  if (ocs.length < 2) continue;
  if (ocs.some((o) => consumido.has(`${o.arquivo}:${o.idx}`))) continue;

  // estende enquanto todas as ocorrências continuarem iguais
  let extra = 0;
  for (;;) {
    const prox = ocs.map((o) => mantidas.get(o.arquivo)[o.idx + DUP_MIN + extra]?.norm);
    if (prox.some((p) => p === undefined) || new Set(prox).size > 1) break;
    extra++;
    if (DUP_MIN + extra > 200) break;
  }
  const tamanho = DUP_MIN + extra;
  for (const o of ocs) for (let k = 0; k <= extra; k++) consumido.add(`${o.arquivo}:${o.idx + k}`);

  duplicados.push({
    linhas: tamanho,
    ocorrencias: ocs.map((o) => {
      const arr = mantidas.get(o.arquivo);
      return { arquivo: o.arquivo, de: arr[o.idx].linha, ate: arr[o.idx + tamanho - 1].linha };
    }),
    amostra: mantidas.get(ocs[0].arquivo).slice(ocs[0].idx, ocs[0].idx + 3).map((x) => x.norm),
  });
}
duplicados.sort((a, b) => b.linhas * b.ocorrencias.length - a.linhas * a.ocorrencias.length);

// ---------------------------------------------------------------- relatório

const porTipo = new Map();
for (const s of sinais) {
  if (!porTipo.has(s.tipo)) porTipo.set(s.tipo, []);
  porTipo.get(s.tipo).push(s);
}

const DESCRICAO = {
  'erro-descartado': 'erro do Supabase descartado (tela vazia em caso de falha)',
  'escrita-sem-retorno': 'insert/update/delete sem conferir o retorno',
  'select-estrela': "select('*') — confira colunas sensíveis e peso",
  'await-em-laco': 'possível N+1 (ida ao banco por item)',
  'await-sequencial': 'awaits independentes em sequência (Promise.all?)',
  'sem-teto': 'consulta sem limit/range no arquivo',
  'contagem-no-cliente': 'contagem feita no cliente (use count: exact, head: true)',
  'sem-limpeza': 'inscrição/timer sem limpeza',
  'arquivo-grande': 'arquivo acima de 400 linhas',
  'data-utc': 'corte de data em UTC (fuso BR)',
  'dinheiro-float': 'valor monetário tratado como float',
  'catch-vazio': 'catch vazio (erro engolido)',
  'env-sem-checagem': 'process.env com ! (quebra silenciosa se faltar na Vercel)',
  'html-cru': 'dangerouslySetInnerHTML (risco de XSS)',
  any: 'tipo any',
  console: 'console.log deixado no código',
  todo: 'TODO/FIXME',
};
const ORDEM = Object.keys(DESCRICAO);

const out = [];
const p = (s = '') => out.push(s);

p(`# Mapa — ${path.basename(raiz)}`);
p(`${codigo.length} arquivos de código · ${codigo.reduce((a, f) => a + f.loc, 0)} linhas · ${sql.length} migrations`);
p();

p('## Rotas');
if (rotas.length === 0) p('_nenhuma rota do App Router encontrada (projeto não-Next?)_');
for (const r of rotas)
  p(`- ${r.tipo === 'api' ? '🔌' : '📄'} \`${r.rota}\`${r.dinamica ? ' (dinâmica)' : ''} — ${r.arquivo} · ${r.loc} linhas${r.client ? ' · use client' : ''}`);
p();

p('## Peso por pasta');
for (const [pasta, loc] of [...porPasta].sort((a, b) => b[1] - a[1]).slice(0, 12)) p(`- ${pasta} — ${loc} linhas`);
p();

p('## Maiores arquivos');
for (const f of [...codigo].sort((a, b) => b.loc - a.loc).slice(0, 10)) p(`- ${f.rel} — ${f.loc} linhas${f.useClient ? ' · use client' : ''}`);
p();

if (tabelas.size) {
  p('## Schema');
  for (const [nome, t] of tabelas) {
    const idx = indices.filter((i) => i.tabela === nome).map((i) => i.colunas.join('+'));
    p(`- **${nome}** — ${t.colunas.length} colunas · RLS ${t.rls ? 'on' : '**off**'} · índices: ${idx.length ? idx.join(', ') : 'nenhum declarado'}`);
  }
  p(`\n${policies} policies declaradas. (Chave primária e \`unique\` já criam índice — não constam acima.)`);
  p();
}

if (semIndice.length) {
  p('## Colunas filtradas sem índice declarado');
  p('_Cruzamento de `.eq/.order/.ilike` com os `create index` das migrations. Confirme no banco._');
  for (const s of semIndice.slice(0, 12)) p(`- \`${s.coluna}\` — ${s.ocorrencias} uso(s): ${s.onde.join(', ')}`);
  p();
}

if (duplicados.length || dadosIgnorados.length) {
  p('## Blocos duplicados');
  if (dadosIgnorados.length) p(`_Fora da conta (arquivo de dados): ${dadosIgnorados.join(', ')}_\n`);
  for (const d of duplicados.slice(0, 12)) {
    p(`- **${d.linhas} linhas × ${d.ocorrencias.length}** — ${d.ocorrencias.map((o) => `${o.arquivo}:${o.de}-${o.ate}`).join(' · ')}`);
    p(`  \`${d.amostra[0]?.slice(0, 100)}\``);
  }
  p();
}

if (papeis.size) {
  p('## Papéis como string literal');
  for (const [papel, arqs] of papeis) p(`- \`${papel}\` em ${arqs.size} arquivo(s)${arqs.size > 3 ? ' ⚠️' : ''}`);
  p();
}

p('## Sinais');
p('_Heurística de texto. Cada um é uma pista para ler o código, não um achado._');
p();
const tipos = [...porTipo.keys()].sort((a, b) => (ORDEM.indexOf(a) + 99) - (ORDEM.indexOf(b) + 99) || a.localeCompare(b));
for (const tipo of tipos) {
  const lista = porTipo.get(tipo);
  p(`### ${tipo} — ${lista.length} (${DESCRICAO[tipo] ?? ''})`);
  for (const s of lista.slice(0, 15)) p(`- ${s.arquivo}:${s.linha}${s.trecho ? ` — \`${s.trecho}\`` : ''}${s.nota ? ` · ${s.nota}` : ''}`);
  if (lista.length > 15) p(`- … mais ${lista.length - 15}`);
  p();
}

console.log(out.join('\n'));

if (saidaJson) {
  fs.writeFileSync(
    path.resolve(saidaJson),
    JSON.stringify({ raiz, rotas, tabelas: [...tabelas], indices, semIndice, duplicados, sinais, papeis: [...papeis].map(([k, v]) => [k, [...v]]) }, null, 2),
    'utf8'
  );
  console.error(`\nJSON em ${path.resolve(saidaJson)}`);
}
