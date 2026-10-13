import { supabase } from './supabase'

// Logótipos dos clientes (migração 045): bucket 'logos', de leitura pública.
// A equipa guarda em ficha/<id da ficha>/…; o cliente na pasta com o seu user_id.

const BUCKET = 'logos'
const TIPOS = ['image/png', 'image/jpeg', 'image/webp']
const MAX = 2 * 1024 * 1024

const MSG = {
  pt: { tipo: 'Use uma imagem PNG, JPEG ou WebP.', grande: 'A imagem tem mais de 2 MB.' },
  de: { tipo: 'Bitte ein PNG-, JPEG- oder WebP-Bild verwenden.', grande: 'Das Bild ist größer als 2 MB.' },
  en: { tipo: 'Please use a PNG, JPEG or WebP image.', grande: 'The image is larger than 2 MB.' },
}

// Devolve o motivo para recusar o ficheiro, ou null se serve.
export function validarLogo(ficheiro, lang = 'pt') {
  const m = MSG[lang] || MSG.pt
  if (!TIPOS.includes(ficheiro.type)) return m.tipo
  if (ficheiro.size > MAX) return m.grande
  return null
}

export function urlLogo(caminho) {
  if (!caminho) return null
  return supabase.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl
}

// Carrega a imagem para a pasta indicada; devolve { caminho } ou { erro }.
export async function enviarLogo(pasta, ficheiro) {
  const ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[ficheiro.type] || 'png'
  // Nome novo a cada envio: o endereço público muda e nenhum browser mostra o antigo da cache
  const caminho = `${pasta}/logo-${Date.now().toString(36)}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(caminho, ficheiro, { upsert: false, contentType: ficheiro.type })
  return error ? { erro: error.message } : { caminho }
}

// Apaga o ficheiro anterior (sem bloquear se já não existir).
export async function apagarLogo(caminho) {
  if (caminho) await supabase.storage.from(BUCKET).remove([caminho])
}
