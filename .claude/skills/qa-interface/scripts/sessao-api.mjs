#!/usr/bin/env node
// Autentica pela API do Supabase e grava a sessão para a varredura usar — sem navegador
// e sem ninguém digitar senha em formulário.
//
// Uso:
//   node sessao-api.mjs --env .env.staging.local --email qa@x.com --senha "Apex-XXXX-YYYY" \
//                       --saida .qa/sessao-admin.json
//   node sessao-api.mjs --url https://ref.supabase.co --anon <anon key> --email ... --senha ...
//
// Para contas DESCARTÁVEIS de QA, criadas para o teste e apagadas no fim. Nunca use a senha
// pessoal de um usuário real: se a conta é de gente de verdade, use `sessao.mjs`, em que a
// própria pessoa faz o login na janela do navegador.
//
// A sessão sai nos dois formatos, porque os projetos da casa se dividem em dois:
//   · localStorage  — @supabase/supabase-js direto no client (Método APEX)
//   · cookie        — @supabase/ssr com middleware (MindBiz, Alph Club)

import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const opt = (nome, padrao) => {
  const i = argv.indexOf(nome);
  return i >= 0 ? argv[i + 1] : padrao;
};

const arquivoEnv = opt('--env');
const email = opt('--email');
const senha = opt('--senha');
const saida = path.resolve(opt('--saida', '.qa/sessao.json'));

if (!email || !senha) {
  console.error('Informe --email e --senha (de uma conta descartável de QA).');
  process.exit(1);
}

// ------------------------------------------------------- url e chave anônima

function lerEnv(arquivo) {
  const texto = fs.readFileSync(arquivo, 'utf8');
  const pares = {};
  for (const linha of texto.split(/\r?\n/)) {
    const l = linha.trim();
    if (!l || l.startsWith('#')) continue;
    const i = l.indexOf('=');
    if (i < 0) continue;
    pares[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return pares;
}

let url = opt('--url');
let anon = opt('--anon');

if (arquivoEnv) {
  if (!fs.existsSync(arquivoEnv)) {
    console.error(`Arquivo não encontrado: ${arquivoEnv}`);
    process.exit(1);
  }
  const env = lerEnv(arquivoEnv);
  url ??= env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL ?? env.STAGING_SUPABASE_URL;
  anon ??= env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? env.SUPABASE_ANON ?? env.STAGING_SUPABASE_ANON ?? env.ANON_KEY;
}

if (!url || !anon) {
  console.error('Não achei a URL e a anon key. Passe --url/--anon ou um --env que as contenha.');
  console.error('(Chaves procuradas: NEXT_PUBLIC_SUPABASE_URL/ANON_KEY, SUPABASE_URL/ANON, STAGING_SUPABASE_URL/ANON.)');
  process.exit(1);
}
url = url.replace(/\/$/, '');
const ref = url.match(/https?:\/\/([^.]+)\./)?.[1] ?? 'projeto';

// ------------------------------------------------------------------- login

const resposta = await fetch(`${url}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { apikey: anon, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password: senha }),
});

const corpo = await resposta.json().catch(() => ({}));
if (!resposta.ok || !corpo.access_token) {
  console.error(`Login recusado (HTTP ${resposta.status}): ${corpo.error_description ?? corpo.msg ?? corpo.error ?? 'sem detalhe'}`);
  if (resposta.status === 400) console.error('Confira e-mail/senha, e se a conta está confirmada (email_confirm).');
  process.exit(2);
}

const sessao = {
  access_token: corpo.access_token,
  token_type: corpo.token_type ?? 'bearer',
  expires_in: corpo.expires_in,
  expires_at: corpo.expires_at ?? Math.floor(Date.now() / 1000) + (corpo.expires_in ?? 3600),
  refresh_token: corpo.refresh_token,
  user: corpo.user,
};

const chave = `sb-${ref}-auth-token`;
const valor = JSON.stringify(sessao);

const pacote = {
  tipo: 'supabase',
  ref,
  email,
  papelJwt: (() => {
    try {
      return JSON.parse(Buffer.from(corpo.access_token.split('.')[1], 'base64').toString('utf8')).role;
    } catch {
      return null;
    }
  })(),
  expiraEm: new Date(sessao.expires_at * 1000).toISOString(),
  localStorage: { [chave]: valor },
  cookies: [
    // Formato do @supabase/ssr. Projetos que usam cookie costumam funcionar com isto;
    // se o app insistir em pedir login, use o sessao.mjs (login na janela do navegador).
    { name: chave, value: `base64-${Buffer.from(valor, 'utf8').toString('base64')}`, domain: 'localhost', path: '/', httpOnly: false, secure: false, sameSite: 'Lax' },
  ],
};

fs.mkdirSync(path.dirname(saida), { recursive: true });
fs.writeFileSync(saida, JSON.stringify(pacote, null, 2), 'utf8');

console.log(`Sessão de ${email} salva em ${saida}`);
console.log(`Projeto ${ref} · expira em ${pacote.expiraEm}`);
console.log('Contém um token válido: pasta ignorada pelo Git, e apague quando a auditoria terminar.');
