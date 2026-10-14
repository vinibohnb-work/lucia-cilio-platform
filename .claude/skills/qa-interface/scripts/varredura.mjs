#!/usr/bin/env node
// Varredura automatizada de interface: cada rota em três viewports, com captura de tela
// e checagens que o olho não faz de forma confiável (contraste, alvo de toque, overflow,
// rótulo acessível, fonte pequena, erro de console, requisição falhando).
//
// Uso:
//   node varredura.mjs --base http://localhost:3000 --projeto "<pasta>" [--sessao .qa/sessao.json]
//                      [--rotas /,/mentorados] [--saida <pasta>] [--viewports mobile,tablet,desktop]
//
// Requer puppeteer-core (já instalado em Scalasys/_tooling) e o Chrome do sistema.
// NÃO substitui o teste manual: ela cobre o mensurável; o julgamento é seu.

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const aqui = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------- argumentos

const argv = process.argv.slice(2);
const opt = (nome, padrao) => {
  const i = argv.indexOf(nome);
  return i >= 0 ? argv[i + 1] : padrao;
};

const base = (opt('--base', 'http://localhost:3000') || '').replace(/\/$/, '');
const projeto = opt('--projeto') ? path.resolve(opt('--projeto')) : null;
const arquivoSessao = opt('--sessao');
const espera = Number(opt('--esperar', 1200));
const somenteViewports = opt('--viewports', 'mobile,tablet,desktop').split(',').map((v) => v.trim());
const saida = path.resolve(
  opt('--saida', projeto ? path.join(projeto, 'docs', 'auditorias', `qa-${new Date().toISOString().slice(0, 10)}`) : './qa')
);

const VIEWPORTS = {
  mobile: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  tablet: { width: 820, height: 1180, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
};
const UA_MOBILE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

// ------------------------------------------------------------ dependências

function carregarPuppeteer() {
  const tentativas = [process.env.PUPPETEER_CORE, 'puppeteer-core'];
  for (const inicio of [aqui, process.cwd(), projeto].filter(Boolean)) {
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
  console.error(
    'puppeteer-core não encontrado.\n' +
      'Instale uma vez em Scalasys/_tooling:  npm i puppeteer-core\n' +
      'Ou aponte:  set PUPPETEER_CORE=<caminho do módulo>'
  );
  process.exit(1);
}

function acharChrome() {
  const candidatos = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe'),
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean);
  const achado = candidatos.find((c) => {
    try {
      return fs.existsSync(c);
    } catch {
      return false;
    }
  });
  if (!achado) {
    console.error('Chrome não encontrado. Defina CHROME_PATH com o caminho do executável.');
    process.exit(1);
  }
  return achado;
}

// ------------------------------------------------------------------- rotas

function descobrirRotas(raiz) {
  const rotas = [];
  const dinamicas = [];
  const appDir = ['app', 'src/app'].map((d) => path.join(raiz, d)).find((d) => fs.existsSync(d));
  if (!appDir) return { rotas, dinamicas };

  (function andar(dir, partes) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (e.name.startsWith('_') || e.name === 'api') continue;
        const grupo = e.name.startsWith('(') && e.name.endsWith(')');
        const paralela = e.name.startsWith('@');
        if (paralela) continue;
        andar(path.join(dir, e.name), grupo ? partes : [...partes, e.name]);
      } else if (/^page\.(tsx?|jsx?)$/.test(e.name)) {
        const rota = '/' + partes.join('/');
        if (rota.includes('[')) dinamicas.push(rota);
        else rotas.push(rota === '/' ? '/' : rota);
      }
    }
  })(appDir, []);

  return { rotas: [...new Set(rotas)].sort(), dinamicas: [...new Set(dinamicas)].sort() };
}

let rotas = opt('--rotas') ? opt('--rotas').split(',').map((r) => r.trim()) : null;
let dinamicas = [];
if (!rotas) {
  if (!projeto) {
    console.error('Informe --rotas ou --projeto (para descobrir as rotas em app/).');
    process.exit(1);
  }
  ({ rotas, dinamicas } = descobrirRotas(projeto));
  if (!rotas.length) {
    console.error('Nenhuma rota encontrada em app/. Use --rotas.');
    process.exit(1);
  }
}

// -------------------------------------------------- checagens dentro da página

// Roda no navegador. Devolve a lista de problemas mensuráveis da tela.
function auditarPagina(ehMobile) {
  const problemas = [];
  const add = (tipo, gravidade, detalhe, alvo) => problemas.push({ tipo, gravidade, detalhe, alvo });

  const seletor = (el) => {
    if (!el) return '';
    if (el.id) return `#${el.id}`;
    const cls = (el.className && typeof el.className === 'string' ? el.className.trim().split(/\s+/)[0] : '') || '';
    const texto = (el.innerText || el.value || '').trim().slice(0, 30);
    return `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}${texto ? ` "${texto}"` : ''}`;
  };

  const visivel = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    const s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0.05;
  };

  const corParaRgb = (cor) => {
    const m = cor.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map((n) => parseFloat(n));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const lum = ({ r, g, b }) => {
    const f = (c) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const contraste = (a, b) => {
    const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
  };
  const fundoEfetivo = (el) => {
    let no = el;
    while (no && no !== document.documentElement) {
      const c = corParaRgb(getComputedStyle(no).backgroundColor);
      if (c && c.a >= 0.9) return c;
      no = no.parentElement;
    }
    const c = corParaRgb(getComputedStyle(document.body).backgroundColor);
    return c && c.a >= 0.9 ? c : { r: 255, g: 255, b: 255, a: 1 };
  };

  // 1. página vazia
  const textoCorpo = (document.body.innerText || '').trim();
  if (textoCorpo.length < 40) add('pagina-vazia', 'bloqueia', `a tela renderizou ${textoCorpo.length} caracteres de texto`, 'body');

  // 2. rolagem horizontal
  const largura = document.documentElement.clientWidth;
  if (document.documentElement.scrollWidth > largura + 2) {
    const culpados = [...document.querySelectorAll('body *')]
      .filter((el) => {
        if (!visivel(el)) return false;
        const r = el.getBoundingClientRect();
        if (r.right <= largura + 2 && r.left >= -2) return false;
        let pai = el.parentElement;
        while (pai) {
          const ox = getComputedStyle(pai).overflowX;
          if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') return false;
          pai = pai.parentElement;
        }
        return true;
      })
      .slice(0, 5)
      .map(seletor);
    add(
      'rolagem-horizontal',
      'atrapalha',
      `conteúdo ${document.documentElement.scrollWidth}px numa tela de ${largura}px`,
      culpados.join(' · ') || 'origem não identificada'
    );
  }

  // 3. zoom bloqueado
  const metaVp = document.querySelector('meta[name="viewport"]')?.getAttribute('content') || '';
  if (/user-scalable\s*=\s*(no|0)/.test(metaVp) || /maximum-scale\s*=\s*(1|1\.0)\b/.test(metaVp))
    add('zoom-bloqueado', 'atrapalha', `meta viewport impede ampliar: "${metaVp}"`, 'meta[name=viewport]');

  // 4. idioma e título
  const lang = document.documentElement.getAttribute('lang');
  if (!lang) add('sem-lang', 'incomoda', 'o <html> não declara lang — leitor de tela lê em inglês', 'html');
  const titulo = (document.title || '').trim();
  if (!titulo || /create next app|localhost|untitled/i.test(titulo))
    add('titulo-generico', 'incomoda', `título da aba: "${titulo}"`, 'title');
  if (!document.querySelector('h1')) add('sem-h1', 'incomoda', 'a tela não tem <h1>', 'body');

  // 5. texto, fonte e contraste
  const comTexto = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    if (n.nodeValue && n.nodeValue.trim().length > 1 && n.parentElement) comTexto.add(n.parentElement);
    if (comTexto.size > 600) break;
  }

  const pequenas = [];
  const ruins = [];
  for (const el of comTexto) {
    if (!visivel(el)) continue;
    const s = getComputedStyle(el);
    const tam = parseFloat(s.fontSize);
    if (tam && tam < 12) pequenas.push({ alvo: seletor(el), tam: Math.round(tam * 10) / 10 });

    const cor = corParaRgb(s.color);
    if (!cor || cor.a < 0.5) continue;
    const fundo = fundoEfetivo(el);
    const r = contraste(cor, fundo);
    const grande = tam >= 24 || (tam >= 18.66 && Number(s.fontWeight) >= 700);
    const minimo = grande ? 3 : 4.5;
    if (r < minimo) ruins.push({ alvo: seletor(el), razao: Math.round(r * 100) / 100, minimo, tam: Math.round(tam) });
  }
  if (pequenas.length)
    add('fonte-pequena', ehMobile ? 'atrapalha' : 'incomoda', `${pequenas.length} elemento(s) abaixo de 12px`, pequenas.slice(0, 5).map((p) => `${p.alvo} (${p.tam}px)`).join(' · '));
  if (ruins.length) {
    ruins.sort((a, b) => a.razao - b.razao);
    add('contraste-baixo', 'atrapalha', `${ruins.length} elemento(s) abaixo do mínimo WCAG AA`, ruins.slice(0, 6).map((r) => `${r.alvo} — ${r.razao}:1 (mín. ${r.minimo})`).join(' · '));
  }

  // 6. campos de formulário
  const campos = [...document.querySelectorAll('input:not([type=hidden]), select, textarea')].filter(visivel);
  const semRotulo = [];
  const fonteInput = [];
  for (const c of campos) {
    const rotulado =
      (c.id && document.querySelector(`label[for="${CSS.escape(c.id)}"]`)) ||
      c.closest('label') ||
      c.getAttribute('aria-label') ||
      c.getAttribute('aria-labelledby') ||
      c.getAttribute('title');
    if (!rotulado) semRotulo.push(`${seletor(c)}${c.placeholder ? ` (só placeholder: "${c.placeholder}")` : ''}`);
    const tam = parseFloat(getComputedStyle(c).fontSize);
    if (ehMobile && tam && tam < 16 && !['checkbox', 'radio', 'submit', 'button'].includes(c.type)) fonteInput.push(`${seletor(c)} (${Math.round(tam)}px)`);
  }
  if (semRotulo.length)
    add('campo-sem-rotulo', 'atrapalha', `${semRotulo.length} campo(s) sem rótulo associado — pode haver texto visível ao lado, mas sem \`label for\`/\`aria-label\` o leitor de tela não liga um ao outro (e clicar no texto não foca o campo)`, semRotulo.slice(0, 5).join(' · '));
  if (fonteInput.length)
    add('input-zoom-ios', 'incomoda', `${fonteInput.length} campo(s) com fonte < 16px: o iPhone dá zoom sozinho ao focar e a tela sai do lugar`, fonteInput.slice(0, 5).join(' · '));

  // 7. alvos de toque (só no mobile)
  if (ehMobile) {
    const interativos = [...document.querySelectorAll('a, button, [role=button], input[type=checkbox], input[type=radio], select, [onclick]')].filter(visivel);
    const pequenos = interativos
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width < 44 || r.height < 44)
      .map(({ el, r }) => `${seletor(el)} (${Math.round(r.width)}×${Math.round(r.height)})`);
    if (pequenos.length)
      add('alvo-pequeno', 'incomoda', `${pequenos.length} alvo(s) abaixo de 44×44px — difícil acertar com o dedo`, pequenos.slice(0, 6).join(' · '));
  }

  // 8. botão/link sem nome acessível
  const semNome = [...document.querySelectorAll('a, button, [role=button]')]
    .filter(visivel)
    .filter((el) => !(el.innerText || '').trim() && !el.getAttribute('aria-label') && !el.getAttribute('title') && !el.querySelector('img[alt]:not([alt=""])'))
    .map(seletor);
  if (semNome.length)
    add('botao-sem-nome', 'incomoda', `${semNome.length} botão/link só com ícone, sem nome acessível`, semNome.slice(0, 5).join(' · '));

  // 9. imagem sem alt
  const semAlt = [...document.querySelectorAll('img:not([alt])')].filter(visivel).map(seletor);
  if (semAlt.length) add('img-sem-alt', 'incomoda', `${semAlt.length} imagem(ns) sem atributo alt`, semAlt.slice(0, 5).join(' · '));

  // 10. texto cortado
  const cortados = [...document.querySelectorAll('body *')]
    .filter((el) => {
      if (!visivel(el) || el.children.length > 0) return false;
      const s = getComputedStyle(el);
      if (s.overflow !== 'hidden' && s.overflowX !== 'hidden') return false;
      if (s.textOverflow === 'ellipsis') return false;
      return el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2;
    })
    .slice(0, 5)
    .map(seletor);
  if (cortados.length) add('texto-cortado', 'atrapalha', `${cortados.length} elemento(s) com conteúdo cortado sem reticência`, cortados.join(' · '));

  // 11. tabela larga sem rolagem própria
  const tabelas = [...document.querySelectorAll('table')].filter(visivel).filter((t) => {
    if (t.getBoundingClientRect().width <= largura + 2) return false;
    let pai = t.parentElement;
    while (pai) {
      const ox = getComputedStyle(pai).overflowX;
      if (ox === 'auto' || ox === 'scroll') return false;
      pai = pai.parentElement;
    }
    return true;
  });
  if (tabelas.length) add('tabela-sem-rolagem', 'atrapalha', `${tabelas.length} tabela(s) mais largas que a tela e sem rolagem própria`, tabelas.map(seletor).join(' · '));

  return {
    problemas,
    medidas: {
      texto: textoCorpo.length,
      interativos: document.querySelectorAll('a, button, input, select, textarea').length,
      altura: document.documentElement.scrollHeight,
      titulo,
    },
  };
}

// -------------------------------------------------- captura de página inteira

// page.screenshot({ fullPage: true }) duplica o conteúdo em páginas com header
// sticky sob viewport móvel emulado com deviceScaleFactor 2: o PNG sai com a
// altura "certa" (scrollHeight × dsf), mas com a tela renderizada duas vezes.
// Em vez disso, rolamos a página capturando um viewport por vez e costuramos
// os quadros num canvas em uma aba em branco (fora do CSP da página auditada).
// O layout não é tocado — redimensionar o viewport para a altura da página,
// a outra saída comum, estica tudo que usa 100vh.
const LIMITE_FISICO = 32000; // dimensão máxima segura de canvas no Chrome (32767)

async function capturarPaginaInteira(pagina, navegador, vp, caminho) {
  const dsf = vp.deviceScaleFactor || 1;

  // desce a página inteira (dispara conteúdo carregado sob demanda) e volta ao topo
  const medidas = await pagina.evaluate(async () => {
    document.documentElement.style.setProperty('scroll-behavior', 'auto', 'important');
    for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 200));
    return { alturaPagina: document.documentElement.scrollHeight, alturaJanela: window.innerHeight };
  });

  const alturaTotal = Math.min(medidas.alturaPagina, Math.floor(LIMITE_FISICO / dsf));
  if (alturaTotal <= medidas.alturaJanela + 2) {
    await pagina.screenshot({ path: caminho, captureBeyondViewport: false });
    return;
  }
  if (alturaTotal < medidas.alturaPagina)
    console.error(`  (página de ${medidas.alturaPagina}px truncada em ${alturaTotal}px na captura)`);

  const compositor = await navegador.newPage();
  try {
    // a aba nova rouba o primeiro plano e o Chrome congela os frames da página
    // auditada — o captureScreenshot dela passa a esperar um frame que não vem
    await pagina.bringToFront();
    await compositor.evaluate((largura, altura) => {
      const tela = document.createElement('canvas');
      tela.width = largura;
      tela.height = altura;
      window.__ctx = tela.getContext('2d');
      window.__ctx.fillStyle = '#fff';
      window.__ctx.fillRect(0, 0, largura, altura);
      window.__tela = tela;
    }, Math.round(vp.width * dsf), Math.round(alturaTotal * dsf));

    let alvo = 0;
    let anterior = -1;
    for (let quadro = 0; quadro < 80; quadro++) {
      const yReal = await pagina.evaluate((y) => {
        window.scrollTo(0, y);
        return Math.round(window.scrollY || window.pageYOffset || 0);
      }, alvo);
      if (yReal <= anterior) break; // a página não rolou: nada novo a capturar
      await new Promise((r) => setTimeout(r, 150));
      const b64 = await pagina.screenshot({ encoding: 'base64', captureBeyondViewport: false });
      await compositor.evaluate(async (dados, yFisico) => {
        const img = new Image();
        img.src = 'data:image/png;base64,' + dados;
        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = () => rej(new Error('quadro ilegível'));
        });
        window.__ctx.drawImage(img, 0, yFisico);
      }, b64, Math.round(yReal * dsf));

      if (yReal + medidas.alturaJanela >= alturaTotal) break;
      if (quadro === 0)
        // daqui para baixo, o fixed repetiria em todo quadro e o sticky voltaria
        // a grudar; some com um e devolve o outro ao fluxo (sticky ocupa o mesmo
        // lugar que static, então o layout não muda)
        await pagina.evaluate(() => {
          for (const el of document.querySelectorAll('body *')) {
            const pos = getComputedStyle(el).position;
            if (pos === 'fixed') el.style.setProperty('visibility', 'hidden', 'important');
            else if (pos === 'sticky') el.style.setProperty('position', 'static', 'important');
          }
        });
      anterior = yReal;
      alvo = yReal + medidas.alturaJanela;
    }

    const png = await compositor.evaluate(() => window.__tela.toDataURL('image/png').split(',')[1]);
    fs.writeFileSync(caminho, Buffer.from(png, 'base64'));
  } finally {
    await compositor.close();
  }
}

// ---------------------------------------------------------------- execução

const puppeteer = carregarPuppeteer();
const chrome = acharChrome();

// A sessão vem em dois formatos: array de cookies (sessao.mjs) ou pacote
// { cookies, localStorage } (sessao-api.mjs). Projetos com @supabase/supabase-js
// direto guardam a sessão em localStorage; com @supabase/ssr, em cookie.
let cookies = null;
let armazenamento = null;
if (arquivoSessao) {
  if (!fs.existsSync(arquivoSessao)) {
    console.error(`Arquivo de sessão não encontrado: ${arquivoSessao}`);
    process.exit(1);
  }
  const bruto = JSON.parse(fs.readFileSync(arquivoSessao, 'utf8'));
  if (Array.isArray(bruto)) cookies = bruto;
  else {
    cookies = bruto.cookies ?? null;
    armazenamento = bruto.localStorage ?? null;
    if (bruto.expiraEm && new Date(bruto.expiraEm) < new Date())
      console.error(`⚠️  A sessão de ${bruto.email ?? 'QA'} expirou em ${bruto.expiraEm} — gere outra antes de confiar no resultado.`);
  }
}

const slug = (rota) => (rota === '/' ? 'home' : rota.replace(/^\//, '').replace(/\//g, '-')) || 'home';

const resultados = [];

const navegador = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: [
    '--no-sandbox',
    '--force-color-profile=srgb',
    '--disable-lcd-text',
    // sem isto o Chrome congela abas fora do primeiro plano e a captura trava
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
  ],
});

try {
  if (cookies?.length) {
    if (typeof navegador.setCookie === 'function') await navegador.setCookie(...cookies);
  }

  for (const nomeVp of somenteViewports) {
    const vp = VIEWPORTS[nomeVp];
    if (!vp) {
      console.error(`viewport desconhecido: ${nomeVp}`);
      continue;
    }
    fs.mkdirSync(path.join(saida, nomeVp), { recursive: true });
    const jaVistas = new Map(); // urlFinal -> rota que já auditou essa tela

    for (const rota of rotas) {
      const url = base + (rota === '/' ? '/' : rota);
      const pagina = await navegador.newPage();
      const erros = [];
      const requisicoes = [];

      pagina.on('console', (m) => {
        if (m.type() === 'error') erros.push({ origem: 'console', texto: m.text().slice(0, 300) });
      });
      pagina.on('pageerror', (e) => erros.push({ origem: 'excecao', texto: String(e.message).slice(0, 300) }));
      pagina.on('requestfailed', (r) => requisicoes.push({ url: r.url().slice(0, 160), status: 'falhou', erro: r.failure()?.errorText }));
      pagina.on('response', (r) => {
        if (r.status() >= 400) requisicoes.push({ url: r.url().slice(0, 160), status: r.status() });
      });

      let urlFinal = url;
      let falha = null;
      try {
        await pagina.setViewport(vp);
        if (vp.isMobile) await pagina.setUserAgent(UA_MOBILE);
        if (cookies?.length && typeof navegador.setCookie !== 'function') await pagina.setCookie(...cookies);
        if (armazenamento)
          await pagina.evaluateOnNewDocument((itens) => {
            try {
              for (const [k, v] of Object.entries(itens)) localStorage.setItem(k, v);
            } catch {}
          }, armazenamento);
        await pagina.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise((r) => setTimeout(r, espera));
        urlFinal = pagina.url();
      } catch (e) {
        falha = String(e.message).slice(0, 200);
      }

      // Sem sessão, todas as rotas protegidas caem na mesma tela de login: audita uma vez.
      const repetida = jaVistas.get(urlFinal);
      if (!falha && repetida !== undefined && repetida !== rota) {
        resultados.push({ rota, viewport: nomeVp, url, urlFinal, redirecionou: true, repeteTelaDe: repetida, problemas: [], erros: [], requisicoes: [] });
        console.error(`= ${nomeVp.padEnd(7)} ${rota} → ${urlFinal.replace(base, '')} (mesma tela de ${repetida})`);
        await pagina.close();
        continue;
      }
      if (!falha) jaVistas.set(urlFinal, rota);

      let auditoria = { problemas: [], medidas: {} };
      let captura = null;
      if (!falha) {
        try {
          auditoria = await pagina.evaluate(auditarPagina, vp.isMobile);
          const alvoCaptura = path.join(saida, nomeVp, `${slug(rota)}.png`);
          await capturarPaginaInteira(pagina, navegador, vp, alvoCaptura);
          captura = alvoCaptura;
        } catch (e) {
          falha = 'falha ao auditar: ' + String(e.message).slice(0, 160);
        }
      }

      const redirecionou = urlFinal.replace(base, '') !== (rota === '/' ? '/' : rota);
      resultados.push({
        rota,
        viewport: nomeVp,
        url,
        urlFinal,
        redirecionou,
        falha,
        erros,
        requisicoes: requisicoes.filter((r) => !/favicon|\.map$/.test(r.url)),
        problemas: auditoria.problemas,
        medidas: auditoria.medidas,
        captura: captura ? path.relative(saida, captura).split(path.sep).join('/') : null,
      });

      const marca = falha ? '✗' : auditoria.problemas.length ? '!' : '·';
      console.error(`${marca} ${nomeVp.padEnd(7)} ${rota}${redirecionou ? ` → ${urlFinal.replace(base, '')}` : ''}`);
      await pagina.close();
    }
  }
} finally {
  await navegador.close();
}

// ------------------------------------------------------------------- saída

fs.mkdirSync(saida, { recursive: true });
fs.writeFileSync(path.join(saida, 'varredura.json'), JSON.stringify({ base, rotas, dinamicas, resultados }, null, 2), 'utf8');

const GRAVIDADE = { bloqueia: '🔴', atrapalha: '🟠', incomoda: '🟡' };
const out = [];
const p = (s = '') => out.push(s);

p(`# Varredura de interface — ${base}`);
p(`${rotas.length} rota(s) × ${somenteViewports.length} viewport(s) · capturas em ${saida}`);
if (cookies?.length || armazenamento)
  p(`Sessão carregada de ${arquivoSessao}${cookies?.length ? ` · ${cookies.length} cookie(s)` : ''}${armazenamento ? ` · ${Object.keys(armazenamento).length} item(ns) de localStorage` : ''}.`);
else p('**Sem sessão** — rotas autenticadas provavelmente redirecionaram para o login.');
if (dinamicas.length) p(`\n⚠️ Rotas dinâmicas não varridas (precisam de id real): ${dinamicas.join(', ')} — passe em \`--rotas\`.`);
p();

const contagem = new Map();
for (const r of resultados) for (const pr of r.problemas) contagem.set(pr.tipo, (contagem.get(pr.tipo) ?? 0) + 1);

p('## Resumo por tipo');
if (!contagem.size) p('_Nenhum problema mensurável encontrado._');
for (const [tipo, n] of [...contagem].sort((a, b) => b[1] - a[1])) p(`- \`${tipo}\` — ${n}`);
p();

p('## Por tela');
for (const nomeVp of somenteViewports) {
  const doVp = resultados.filter((r) => r.viewport === nomeVp);
  if (!doVp.length) continue;
  p(`\n### ${nomeVp}`);
  const repetidas = doVp.filter((r) => r.repeteTelaDe !== undefined);
  if (repetidas.length)
    p(`\n_${repetidas.length} rota(s) caíram na mesma tela já auditada (redirecionamento): ${repetidas.map((r) => r.rota).join(', ')}._`);
  for (const r of doVp.filter((r) => r.repeteTelaDe === undefined)) {
    const cabecalho = `**${r.rota}**${r.redirecionou ? ` → redirecionou para \`${r.urlFinal.replace(base, '')}\`` : ''}`;
    const nada = !r.falha && !r.erros.length && !r.requisicoes.length && !r.problemas.length;
    p(`\n- ${cabecalho}${nada ? ' — sem apontamentos' : ''}`);
    if (r.falha) p(`  - 🔴 não carregou: ${r.falha}`);
    for (const e of r.erros.slice(0, 5)) p(`  - 🔴 ${e.origem}: ${e.texto}`);
    for (const q of r.requisicoes.slice(0, 5)) p(`  - 🟠 requisição ${q.status}: ${q.url}${q.erro ? ` (${q.erro})` : ''}`);
    for (const pr of r.problemas) p(`  - ${GRAVIDADE[pr.gravidade] ?? '🔵'} \`${pr.tipo}\` — ${pr.detalhe}${pr.alvo ? `\n    ${pr.alvo}` : ''}`);
    if (r.captura) p(`  - 📷 ${r.captura}`);
  }
}
p();
p('---');
p('Isto é o mensurável. Abra as capturas e olhe: hierarquia, espaçamento, texto ambíguo,');
p('estado vazio sem explicação e fluxo que não faz sentido não aparecem em nenhuma métrica.');

const md = out.join('\n');
fs.writeFileSync(path.join(saida, 'varredura.md'), md, 'utf8');
console.log(md);
