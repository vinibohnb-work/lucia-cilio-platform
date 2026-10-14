#!/usr/bin/env node
// Abre o Chrome visível para o usuário fazer login com as próprias credenciais e salva
// os cookies da sessão para a varredura usar depois.
//
// Uso:  node sessao.mjs --base http://localhost:3000 [--saida .qa/sessao.json] [--minutos 5]
//
// Por que existe: o agente não digita senha de ninguém. Quem loga é você, nesta janela.
// O arquivo gerado contém cookies de sessão válidos — trate como segredo, deixe em pasta
// ignorada pelo Git e apague quando terminar a auditoria.

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const aqui = path.dirname(fileURLToPath(import.meta.url));

const argv = process.argv.slice(2);
const opt = (nome, padrao) => {
  const i = argv.indexOf(nome);
  return i >= 0 ? argv[i + 1] : padrao;
};

const base = (opt('--base', 'http://localhost:3000') || '').replace(/\/$/, '');
const saida = path.resolve(opt('--saida', '.qa/sessao.json'));
const limiteMs = Number(opt('--minutos', 5)) * 60_000;

function carregarPuppeteer() {
  const tentativas = [process.env.PUPPETEER_CORE, 'puppeteer-core'];
  for (const inicio of [aqui, process.cwd()]) {
    let dir = path.resolve(inicio);
    for (let i = 0; i < 8; i++) {
      tentativas.push(path.join(dir, 'node_modules', 'puppeteer-core'));
      tentativas.push(path.join(dir, '_tooling', 'node_modules', 'puppeteer-core'));
      const pai = path.dirname(dir);
      if (pai === dir) break;
      dir = pai;
    }
  }
  for (const t of tentativas) {
    if (!t) continue;
    try {
      return require(t);
    } catch {}
  }
  console.error('puppeteer-core não encontrado. Instale em Scalasys/_tooling: npm i puppeteer-core');
  process.exit(1);
}

function acharChrome() {
  const candidatos = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe'),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
  ].filter(Boolean);
  const achado = candidatos.find((c) => fs.existsSync(c));
  if (!achado) {
    console.error('Chrome não encontrado. Defina CHROME_PATH.');
    process.exit(1);
  }
  return achado;
}

const puppeteer = carregarPuppeteer();
const navegador = await puppeteer.launch({
  executablePath: acharChrome(),
  headless: false,
  defaultViewport: null,
  args: ['--no-sandbox', `--window-size=1280,900`],
});

const [pagina] = await navegador.pages();
try {
  await pagina.goto(base, { waitUntil: 'domcontentloaded', timeout: 30000 });
} catch (e) {
  console.error(`Não consegui abrir ${base}: ${String(e.message).split('\n')[0]}`);
  console.error('O servidor de desenvolvimento está no ar? (npm run dev)');
  await navegador.close();
  process.exit(1);
}

console.log(`\nFaça o login na janela que abriu (${base}).`);
console.log('Assim que a sessão for detectada, salvo os cookies e fecho sozinho.');
console.log(`Tempo máximo de espera: ${limiteMs / 60000} minutos.\n`);

const lerCookies = async () => (typeof navegador.cookies === 'function' ? navegador.cookies() : pagina.cookies());

const inicio = Date.now();
let cookies = [];
let estaveis = 0;

while (Date.now() - inicio < limiteMs) {
  await new Promise((r) => setTimeout(r, 2000));
  let atual = [];
  try {
    atual = await lerCookies();
  } catch {
    break; // janela fechada pelo usuário
  }
  const temSessao = atual.some((c) => /^sb-|access[_-]?token|session/i.test(c.name) && String(c.value).length > 20);
  let url = '';
  try {
    url = pagina.url();
  } catch {}
  const foraDoLogin = url && !/\/(login|signin|entrar|auth)/i.test(url);

  if (temSessao && foraDoLogin) {
    estaveis++;
    cookies = atual;
    if (estaveis >= 2) break; // duas leituras seguidas: o login assentou
  } else {
    estaveis = 0;
  }
}

if (!cookies.length) {
  console.error('\nNão detectei uma sessão. Nada foi salvo.');
  console.error('Se você logou e mesmo assim deu isso, rode com --minutos 10 ou confira o nome do cookie de sessão.');
  await navegador.close();
  process.exit(2);
}

fs.mkdirSync(path.dirname(saida), { recursive: true });
fs.writeFileSync(saida, JSON.stringify(cookies, null, 2), 'utf8');
await navegador.close();

console.log(`Sessão salva: ${saida} (${cookies.length} cookies)`);
console.log('Cookies de sessão valem como credencial — mantenha em pasta ignorada pelo Git e apague depois.');
