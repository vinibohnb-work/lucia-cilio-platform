import { useState, useEffect } from 'react'
import { useLang } from '../context/LangContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import { validarLogo, enviarLogo, apagarLogo, urlLogo } from '../lib/logos'

// O cliente põe o logótipo da empresa (Empresa → Geral). Fica na ficha dele, onde a
// equipa o vê (migração 045). Em "Ver como o cliente" só se mostra.

export default function LogoEmpresa({ userId, soLeitura }) {
  const { lang } = useLang()
  const { t } = useTheme()
  const [logo, setLogo] = useState(null)
  const [aEnviar, setAEnviar] = useState(false)
  const [msg, setMsg] = useState('')

  const L = {
    pt: { rot: 'Logótipo da empresa', carregar: 'Carregar imagem', trocar: 'Trocar', remover: 'Remover', a: 'A carregar…', dica: 'PNG, JPEG ou WebP, até 2 MB. Aparece na sua ficha na LC Office.', semFicha: 'A sua ficha ainda não está criada — fale com a equipa.', erro: 'Não foi possível guardar o logótipo.' },
    de: { rot: 'Firmenlogo', carregar: 'Bild hochladen', trocar: 'Ersetzen', remover: 'Entfernen', a: 'Wird hochgeladen…', dica: 'PNG, JPEG oder WebP, bis 2 MB. Erscheint in Ihrer Akte bei LC Office.', semFicha: 'Ihre Akte ist noch nicht angelegt — bitte wenden Sie sich an das Team.', erro: 'Das Logo konnte nicht gespeichert werden.' },
    en: { rot: 'Company logo', carregar: 'Upload image', trocar: 'Replace', remover: 'Remove', a: 'Uploading…', dica: 'PNG, JPEG or WebP, up to 2 MB. Shown on your file at LC Office.', semFicha: 'Your client file has not been created yet — please contact the team.', erro: 'The logo could not be saved.' },
  }[lang] || {}

  useEffect(() => {
    if (!userId) return
    supabase.from('clientes').select('logo').eq('user_id', userId).maybeSingle()
      .then(({ data }) => setLogo(data?.logo || null))
  }, [userId])

  async function gravar(caminho) {
    const { data, error } = await supabase.rpc('definir_logo_cliente', { caminho })
    if (error) { setMsg(L.erro); return false }
    if (!data) { setMsg(L.semFicha); return false }
    return true
  }

  async function escolher(ficheiro) {
    setMsg('')
    const motivo = validarLogo(ficheiro, lang)
    if (motivo) { setMsg(motivo); return }
    setAEnviar(true)
    const r = await enviarLogo(userId, ficheiro)
    if (r.erro) { setAEnviar(false); setMsg(L.erro); return }
    if (await gravar(r.caminho)) { apagarLogo(logo); setLogo(r.caminho) } else apagarLogo(r.caminho)
    setAEnviar(false)
  }

  async function remover() {
    setMsg('')
    if (await gravar(null)) { apagarLogo(logo); setLogo(null) }
  }

  return (
    <div>
      <div style={{ fontSize: '12px', fontWeight: 700, color: t.text, marginBottom: '6px' }}>{L.rot}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {logo && <img src={urlLogo(logo)} alt="" style={{ height: '56px', maxWidth: '160px', objectFit: 'contain', background: '#fff', borderRadius: '8px', border: `1px solid ${t.cardBorder}`, padding: '4px' }} />}
        {!soLeitura && (
          <>
            <label style={{ fontSize: '13px', fontWeight: 700, color: t.accentText, cursor: aEnviar ? 'wait' : 'pointer', border: `1px dashed ${t.inputBorder}`, borderRadius: '9px', padding: '9px 14px' }}>
              {aEnviar ? L.a : logo ? L.trocar : L.carregar}
              <input type="file" accept="image/png,image/jpeg,image/webp" disabled={aEnviar} style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) escolher(f) }} />
            </label>
            {logo && <button onClick={remover} style={{ background: 'none', border: 'none', padding: '6px', cursor: 'pointer', fontSize: '12.5px', fontWeight: 700, color: t.subtle, fontFamily: 'inherit' }}>{L.remover}</button>}
          </>
        )}
      </div>
      <div style={{ fontSize: '11.5px', color: msg ? t.neg : t.subtle, marginTop: '6px' }}>{msg || L.dica}</div>
    </div>
  )
}
