import { supabase } from './supabase'

// Página do evento por edição (LUC-242, migração 065): auxiliares partilhados entre
// Gestão → Eventos e o cartão "Página do evento".

export const BUCKET_PAGINA = 'eventos-pagina'
const SITE = typeof window !== 'undefined' && window.location.hostname.endsWith('lcoffice.pt') ? 'https://lcoffice.pt' : (typeof window !== 'undefined' ? window.location.origin : '')
export const linkPagina = (id) => `${SITE}/momentos/?e=${encodeURIComponent(id)}`
// Para o WhatsApp e as redes: mostra o título, a data e a imagem desta edição (api/momentos-partilha.js)
export const linkPartilha = (id) => `${SITE}/momentos/e/${encodeURIComponent(id)}`

export const PAGINA_VAZIA = {
  hora_inicio: '15:00', hora_fim: '19:30', rececao: '', tema_1: '', tema_2: '',
  local_nome: '', local_cidade: '', morada: '', mapa_lat: null, mapa_lng: null,
  preco: '', luma_url: '', inclui: [], programa_resumo: '', programa: [],
  oradores_titulo: '', palestrantes: [], og_imagem: '',
}

// Caminho no bucket a partir do endereço público (só as fotos desta edição)
export function caminhoNoBucket(url, eventoId) {
  const m = /\/storage\/v1\/object\/public\/eventos-pagina\/(.+)$/.exec(String(url || ''))
  if (!m) return null
  const caminho = decodeURIComponent(m[1])
  return caminho.startsWith(eventoId + '/') ? caminho : null
}

// Duplicar: copia as fotos para a pasta da edição nova e troca os endereços
export async function copiarFotos(pagina, deId, paraId) {
  const nova = JSON.parse(JSON.stringify(pagina || PAGINA_VAZIA))
  const copia = async (url) => {
    const de = caminhoNoBucket(url, deId)
    if (!de) return url
    const para = paraId + de.slice(deId.length)
    const { error } = await supabase.storage.from(BUCKET_PAGINA).copy(de, para)
    if (error) return url
    return supabase.storage.from(BUCKET_PAGINA).getPublicUrl(para).data.publicUrl
  }
  nova.og_imagem = await copia(nova.og_imagem)
  for (const p of nova.palestrantes || []) p.foto = await copia(p.foto)
  return nova
}
