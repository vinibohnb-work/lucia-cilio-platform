/* Service worker da LC Office Consulting.
 *
 * Escrito à mão de propósito: um manifesto de pré-cache gerado no build teria
 * de ser mantido em sincronia com os nomes dos ficheiros do Vite, e um erro aí
 * deixa a aplicação presa numa versão antiga em produção. Como o Vite já põe um
 * hash no nome de cada ficheiro de `/assets/`, "cache primeiro" é seguro sem
 * lista nenhuma: um ficheiro com aquele nome nunca muda de conteúdo.
 *
 * Regras:
 *  · navegação  → rede primeiro, casca guardada quando a rede falha;
 *  · /assets/*  → cache primeiro (nomes com hash);
 *  · /api/*, Supabase e tudo o que é de outra origem → nunca tocado.
 *
 * Não há `skipWaiting()`: uma versão nova só assume quando todos os separadores
 * da aplicação fecham. Demora mais a chegar, mas nunca troca o código por baixo
 * de uma sessão a meio de um lançamento no livro de caixa.
 */

const VERSAO = 'lc-v1'
const CASCA = `casca-${VERSAO}`
const ESTATICOS = `estaticos-${VERSAO}`
const OFFLINE = '/offline.html'

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CASCA)
    // `reload` evita guardar uma cópia que o browser já tinha em cache HTTP.
    await c.addAll([new Request('/', { cache: 'reload' }), new Request(OFFLINE, { cache: 'reload' })])
  })())
})

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const nomes = await caches.keys()
    await Promise.all(nomes.filter(n => !n.endsWith(VERSAO)).map(n => caches.delete(n)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  // Outra origem (Supabase, fontes) e as funções do servidor ficam de fora: são
  // dados de clientes ou respostas autenticadas, não têm nada que ver aqui.
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return

  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const res = await fetch(req)
        // Guarda sempre a casca mais recente, para o próximo arranque sem rede.
        const c = await caches.open(CASCA)
        c.put('/', res.clone())
        return res
      } catch {
        const c = await caches.open(CASCA)
        return (await c.match('/')) || (await c.match(OFFLINE)) || Response.error()
      }
    })())
    return
  }

  if (url.pathname.startsWith('/assets/') || /\.(png|jpe?g|svg|webp|ico|woff2?)$/i.test(url.pathname)) {
    e.respondWith((async () => {
      const c = await caches.open(ESTATICOS)
      const guardado = await c.match(req)
      if (guardado) return guardado
      const res = await fetch(req)
      if (res.ok && res.type === 'basic') c.put(req, res.clone())
      return res
    })())
  }
})
