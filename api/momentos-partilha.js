import { createClient } from '@supabase/supabase-js'
import { edicaoPublicada, hojeLisboa } from './evento.js'

// ============================================================================
// Link de partilha de cada edição do Momentos (LUC-242, migração 065).
//
// O WhatsApp e as redes não correm o JavaScript da landing: leem só as etiquetas
// og:* do HTML. A landing é estática (public/momentos/index.html) e preenche o
// conteúdo da edição no navegador, por isso a pré-visualização viria sempre com a
// imagem e o título de 24/10. Este endereço devolve um HTML mínimo com o título,
// a data, o local e a imagem de partilha da edição e encaminha a pessoa para a
// página (lcoffice.pt/momentos/?e=<id>).
//
//   GET /momentos/e/<id>   (vercel.json → /api/momentos-partilha?e=<id>)
//   GET /momentos/e/       → a edição marcada como atual
// ============================================================================

const URL_DB = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SITE = 'https://lcoffice.pt'

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const idValido = (v) => typeof v === 'string' && /^[a-z0-9-]{2,80}$/.test(v)

export function montarHtml(evento) {
  const p = evento?.pagina || {}
  const destino = evento ? `${SITE}/momentos/?e=${encodeURIComponent(evento.id)}` : `${SITE}/momentos/`
  const data = evento?.data ? new Date(evento.data + 'T12:00:00Z') : null
  const diaMes = data ? data.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', timeZone: 'UTC' }) : ''
  const dataLonga = data ? data.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : ''
  const cidade = typeof p.local_cidade === 'string' ? p.local_cidade.trim() : ''
  const local = [typeof p.local_nome === 'string' ? p.local_nome.trim() : (evento?.local || ''), cidade].filter(Boolean).join(', ')
  const nome = evento?.nome || 'Momentos entre Empreendedores'
  const titulo = `${nome}${diaMes ? ' · ' + diaMes : ''}${cidade ? ', ' + cidade : ''}`
  const tema = [p.tema_1, p.tema_2].filter(x => typeof x === 'string' && x.trim()).join(' ')
  const descricao = [dataLonga, local, tema].filter(Boolean).join(' · ')
  let imagem = typeof p.og_imagem === 'string' ? p.og_imagem.trim() : ''
  if (imagem.startsWith('/momentos/')) imagem = SITE + imagem
  if (!/^https:\/\//.test(imagem)) imagem = `${SITE}/momentos/og.jpg`
  return `<!doctype html>
<html lang="pt-PT"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descricao)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_PT">
<meta property="og:site_name" content="LC Office Consulting">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descricao)}">
<meta property="og:url" content="${esc(destino)}">
<meta property="og:image" content="${esc(imagem)}">
<meta property="og:image:alt" content="${esc(titulo)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(titulo)}">
<meta name="twitter:description" content="${esc(descricao)}">
<meta name="twitter:image" content="${esc(imagem)}">
<link rel="canonical" href="${esc(destino)}">
<meta http-equiv="refresh" content="0;url=${esc(destino)}">
</head><body>
<p><a href="${esc(destino)}">${esc(titulo)}</a></p>
<script>location.replace(${JSON.stringify(destino).replace(/</g, '\\u003c')})</script>
</body></html>`
}

export default async function handler(req, res) {
  const pedido = typeof req.query?.e === 'string' ? req.query.e : ''
  let evento = null
  if (URL_DB && SERVICE_KEY && (!pedido || idValido(pedido))) {
    try {
      const db = createClient(URL_DB, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
      let q = db.from('eventos').select('id, nome, data, local, pagina, pagina_atual').not('pagina', 'is', null)
      q = pedido ? q.eq('id', pedido) : q.eq('pagina_atual', true)
      const { data } = await q.maybeSingle()
      // LUC-268: edição ainda não publicada → pré-visualização genérica (sem título, data nem imagem dela)
      evento = data && edicaoPublicada(data, hojeLisboa()) ? data : null
    } catch (e) { console.error('api/momentos-partilha', e) }
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
  return res.status(200).send(montarHtml(evento))
}
