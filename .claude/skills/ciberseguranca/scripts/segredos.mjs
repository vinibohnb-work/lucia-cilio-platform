#!/usr/bin/env node
// Varredura de segredos num projeto Scalasys: arquivos, .gitignore e histórico do Git.
// Sem dependências. NUNCA imprime o valor de um segredo — só tipo, local e tamanho.
//
// Uso:  node segredos.mjs "<pasta do projeto>" [--json <saida.json>]
//
// O diferencial em relação a um grep: decodifica o JWT do Supabase e diz se a claim
// `role` é `anon` (esperado, público por design) ou `service_role` (incidente).

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const IGNORAR_DIR = new Set([
  'node_modules', '.next', '.git', '.vercel', '.turbo', '.cache', '.qa', '.claude',
  'dist', 'build', 'out', 'coverage', '__pycache__', '.venv', 'venv',
]);
const IGNORAR_ARQ = new Set(['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'tsconfig.tsbuildinfo']);
const EXT_TEXTO = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.md', '.html', '.htm',
  '.sql', '.yml', '.yaml', '.txt', '.sh', '.ps1', '.py', '.css', '.toml', '.ini', '.xml', '.csv',
]);
const LIMITE_BYTES = 2 * 1024 * 1024;

const argv = process.argv.slice(2);
const raiz = path.resolve(argv.find((a) => !a.startsWith('--')) ?? '.');
const saidaJson = argv.indexOf('--json') >= 0 ? argv[argv.indexOf('--json') + 1] : undefined;

if (!fs.existsSync(raiz)) {
  console.error(`Pasta não encontrada: ${raiz}`);
  process.exit(1);
}

// ------------------------------------------------------------------ padrões

const PADROES = [
  { tipo: 'jwt', re: /eyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g, sev: '?', desc: 'JWT (Supabase ou outro)' },
  { tipo: 'supabase-secret', re: /\bsb_secret_[A-Za-z0-9_-]{16,}/g, sev: 'critico', desc: 'chave secreta do Supabase (formato novo) — ignora RLS' },
  { tipo: 'supabase-publishable', re: /\bsb_publishable_[A-Za-z0-9_-]{16,}/g, sev: 'info', desc: 'chave publicável do Supabase (pública por design)' },
  { tipo: 'openai', re: /\bsk-(proj-)?[A-Za-z0-9_-]{24,}/g, sev: 'critico', desc: 'chave OpenAI' },
  { tipo: 'anthropic', re: /\bsk-ant-[A-Za-z0-9_-]{20,}/g, sev: 'critico', desc: 'chave Anthropic' },
  { tipo: 'aws', re: /\bAKIA[0-9A-Z]{16}\b/g, sev: 'critico', desc: 'access key da AWS' },
  { tipo: 'google', re: /\bAIza[0-9A-Za-z_-]{35}\b/g, sev: 'alto', desc: 'chave de API do Google' },
  { tipo: 'stripe', re: /\b[sr]k_live_[0-9A-Za-z]{16,}/g, sev: 'critico', desc: 'chave Stripe de produção' },
  { tipo: 'stripe-teste', re: /\b[sr]k_test_[0-9A-Za-z]{16,}/g, sev: 'baixo', desc: 'chave Stripe de teste' },
  { tipo: 'github', re: /\b(gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})/g, sev: 'critico', desc: 'token do GitHub' },
  { tipo: 'sendgrid', re: /\bSG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}/g, sev: 'alto', desc: 'chave SendGrid' },
  { tipo: 'slack', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}/g, sev: 'alto', desc: 'token do Slack' },
  { tipo: 'twilio', re: /\bSK[0-9a-f]{32}\b/g, sev: 'alto', desc: 'chave Twilio' },
  { tipo: 'chave-privada', re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/g, sev: 'critico', desc: 'chave privada' },
  { tipo: 'conexao-postgres', re: /postgres(?:ql)?:\/\/[^\s:@'"]+:[^\s@'"]+@/g, sev: 'critico', desc: 'string de conexão com senha' },
  { tipo: 'senha-literal', re: /\b(senha|password|passwd|pwd)\s*[:=]\s*['"][^'"\n]{6,}['"]/gi, sev: 'alto', desc: 'senha escrita no arquivo' },
  { tipo: 'segredo-generico', re: /\b(secret|token|api[_-]?key|apikey|auth[_-]?key)\s*[:=]\s*['"][A-Za-z0-9_\-/+=]{20,}['"]/gi, sev: 'alto', desc: 'segredo atribuído no código' },
];

const PLACEHOLDER = /(exemplo|example|placeholder|your[_-]|seu[_-]|sua[_-]|changeme|troque|xxxx|\.\.\.|<[^>]+>|••|\*\*\*\*|foo|bar|test123|dummy|sample)/i;

// ------------------------------------------------------------------ ajudantes

function redigir(valor) {
  const v = String(valor);
  return `${v.slice(0, 4)}…(${v.length} car.)`;
}

function decodificarJwt(token) {
  try {
    const payload = token.split('.')[1];
    const json = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function git(args) {
  try {
    return execFileSync('git', ['-C', raiz, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------ varredura

const achados = [];
const arquivosLidos = [];

(function andar(dir) {
  let entradas;
  try {
    entradas = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entradas) {
    const completo = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (IGNORAR_DIR.has(e.name)) continue;
      andar(completo);
      continue;
    }
    if (!e.isFile() || IGNORAR_ARQ.has(e.name)) continue;
    const ext = path.extname(e.name);
    const ehEnv = /^\.env/.test(e.name) || /\.env(\.|$)/.test(e.name);
    if (!EXT_TEXTO.has(ext) && !ehEnv) continue;
    let st;
    try {
      st = fs.statSync(completo);
    } catch {
      continue;
    }
    if (st.size > LIMITE_BYTES) continue;
    arquivosLidos.push(completo);
  }
})(raiz);

const relativo = (p) => path.relative(raiz, p).split(path.sep).join('/');

for (const abs of arquivosLidos) {
  let texto;
  try {
    texto = fs.readFileSync(abs, 'utf8');
  } catch {
    continue;
  }
  if (texto.includes('\u0000')) continue;
  const linhas = texto.split(/\r?\n/);
  const arq = relativo(abs);
  const ehEnv = /(^|\/)\.env/.test(arq);
  const ehExemplo = /\.example$|\.sample$/.test(arq);

  linhas.forEach((linha, i) => {
    if (linha.length > 4000) return;
    for (const padrao of PADROES) {
      padrao.re.lastIndex = 0;
      for (const m of linha.matchAll(padrao.re)) {
        const valor = m[0];
        if (PLACEHOLDER.test(valor) && padrao.tipo !== 'jwt') continue;
        if (/process\.env\./.test(linha) && padrao.tipo === 'segredo-generico') continue;

        const achado = {
          tipo: padrao.tipo,
          desc: padrao.desc,
          sev: padrao.sev,
          arquivo: arq,
          linha: i + 1,
          amostra: redigir(valor),
          contexto: linha.trim().slice(0, 80).replace(valor, redigir(valor)),
          nota: '',
        };

        if (padrao.tipo === 'jwt') {
          const p = decodificarJwt(valor);
          const papel = p?.role ?? 'sem claim role';
          const origem = p?.ref ?? p?.iss ?? p?.aud ?? '—';
          const exp = p?.exp ? new Date(p.exp * 1000).toISOString().slice(0, 10) : '—';
          const vencido = p?.exp && p.exp * 1000 < Date.now();
          achado.nota = `role=${papel} · origem=${origem} · expira=${exp}${vencido ? ' (vencido)' : ''}`;
          if (papel === 'service_role') {
            achado.sev = 'critico';
            achado.desc = 'SERVICE_ROLE do Supabase — ignora RLS, acesso total ao banco';
          } else if (papel === 'anon') {
            achado.sev = ehEnv || /\.(ts|tsx|js|jsx)$/.test(arq) ? 'info' : 'baixo';
            achado.desc = 'anon key do Supabase (pública por design — só é risco se a RLS falhar)';
          } else {
            achado.sev = 'alto';
            achado.desc = 'JWT de origem não identificada';
          }
        }

        if (ehExemplo) {
          achado.sev = 'info';
          achado.nota += ' · arquivo de exemplo';
        }
        achados.push(achado);
      }
    }
  });
}

// ------------------------------------------------- .gitignore, Git e ambiente

const avisos = [];

const gitignorePath = path.join(raiz, '.gitignore');
const gitignore = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : null;
if (gitignore === null) {
  avisos.push({ sev: 'alto', texto: 'Não há .gitignore na raiz do projeto.' });
} else {
  for (const alvo of ['.env', 'node_modules', '.next', '.vercel']) {
    if (!gitignore.split(/\r?\n/).some((l) => l.trim().replace(/^\/+|\/+$/g, '').startsWith(alvo.replace(/^\./, '.'))))
      avisos.push({ sev: alvo === '.env' ? 'critico' : 'baixo', texto: `\`${alvo}\` não aparece no .gitignore.` });
  }
}

const ehRepo = git(['rev-parse', '--is-inside-work-tree']);
if (ehRepo) {
  const rastreados = (git(['ls-files']) ?? '').split(/\r?\n/);
  const envRastreado = rastreados.filter((f) => /(^|\/)\.env/.test(f) && !/\.example$|\.sample$/.test(f));
  for (const f of envRastreado)
    avisos.push({ sev: 'critico', texto: `\`${f}\` está **rastreado pelo Git** — o conteúdo já foi para o histórico.` });

  const NO_HISTORICO = [
    { alvo: 'eyJhbGci', sev: 'alto', nota: 'confira se é anon (esperado) ou service_role (incidente): `git show <commit>`' },
    { alvo: 'sb_secret_', sev: 'critico', nota: 'chave secreta do Supabase' },
    { alvo: 'BEGIN PRIVATE KEY', sev: 'critico', nota: 'chave privada' },
    { alvo: 'service_role', sev: 'medio', nota: 'a palavra aparece legitimamente em `grant` de migration e em script que busca a chave pela API — confirme o commit antes de tratar como vazamento' },
  ];
  for (const { alvo, sev, nota } of NO_HISTORICO) {
    const log = git(['log', '--all', '--oneline', '-S', alvo, '--', '.']);
    const linhas = (log ?? '').split(/\r?\n/).filter(Boolean);
    if (linhas.length)
      avisos.push({
        sev,
        texto: `\`${alvo}\` aparece em ${linhas.length} commit(s): ${linhas.slice(0, 3).map((l) => l.split(' ')[0]).join(', ')}${linhas.length > 3 ? '…' : ''} — ${nota}. Apagar o arquivo hoje não remove do histórico.`,
      });
  }
} else {
  avisos.push({ sev: 'alto', texto: 'A pasta não é um repositório Git — não há histórico nem backup versionado.' });
}

// variável NEXT_PUBLIC_ com cara de segredo
for (const abs of arquivosLidos) {
  let texto;
  try {
    texto = fs.readFileSync(abs, 'utf8');
  } catch {
    continue;
  }
  for (const m of texto.matchAll(/NEXT_PUBLIC_([A-Z0-9_]+)/g)) {
    const nome = m[1];
    if (/(SERVICE|SECRET|PRIVATE|PASSWORD|SENHA)/.test(nome))
      avisos.push({
        sev: 'critico',
        texto: `\`NEXT_PUBLIC_${nome}\` em ${relativo(abs)} — tudo com prefixo NEXT_PUBLIC_ vai para o bundle do navegador.`,
      });
  }
}

if (/OneDrive|Google Drive|Dropbox|iCloud/i.test(raiz))
  avisos.push({
    sev: 'medio',
    texto: 'O projeto está dentro de pasta sincronizada com nuvem. Pela governança da casa, código mora fora do sincronizador e `.env` só no disco local e no painel do serviço.',
  });

// ------------------------------------------------------------------ saída

const ORDEM = { critico: 0, alto: 1, medio: 2, baixo: 3, info: 4, '?': 5 };
const ROTULO = { critico: '🔴 CRÍTICO', alto: '🟠 ALTO', medio: '🟡 MÉDIO', baixo: '🔵 BAIXO', info: '⚪ ESPERADO', '?': '❔' };

achados.sort((a, b) => ORDEM[a.sev] - ORDEM[b.sev] || a.arquivo.localeCompare(b.arquivo));
avisos.sort((a, b) => ORDEM[a.sev] - ORDEM[b.sev]);

const out = [];
const p = (s = '') => out.push(s);

p(`# Segredos — ${path.basename(raiz)}`);
p(`${arquivosLidos.length} arquivos de texto varridos · ${achados.length} ocorrência(s) · ${avisos.length} aviso(s)`);
p('_Valores nunca são impressos: só tipo, local e tamanho._');
p();

if (achados.length === 0) p('Nenhum padrão de segredo encontrado nos arquivos.\n');

let sevAtual = null;
for (const a of achados) {
  if (a.sev !== sevAtual) {
    sevAtual = a.sev;
    p(`## ${ROTULO[a.sev]}`);
  }
  p(`- **${a.desc}** — \`${a.arquivo}:${a.linha}\``);
  p(`  ${a.amostra}${a.nota ? ` · ${a.nota}` : ''}`);
}
p();

if (avisos.length) {
  p('## Avisos de configuração');
  for (const a of avisos) p(`- ${ROTULO[a.sev]} — ${a.texto}`);
  p();
}

p('---');
p('Lembrete de leitura: `anon key` no bundle é o funcionamento normal do Supabase — o que');
p('a torna perigosa é RLS ausente ou permissiva. `service_role` em qualquer lugar que chegue');
p('ao navegador é incidente: rotacione antes de continuar a auditoria.');

console.log(out.join('\n'));

if (saidaJson) {
  fs.writeFileSync(path.resolve(saidaJson), JSON.stringify({ raiz, achados, avisos }, null, 2), 'utf8');
  console.error(`\nJSON em ${path.resolve(saidaJson)}`);
}
