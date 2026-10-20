import { useState } from 'react'
import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useLista } from '../../lib/useMetodoESG'
import { CampoTexto, CartaoMetodo } from './MetodoUI'
import { ESG_TOPICS, topicLabel } from '../../data/esgTopics'

// Fase 2 do método — "O que realmente importa?". Transformar sintomas em
// problemas concretos: sintoma → causa → impacto, ligado a um tema. Ex.: "não
// temos dados" é um sintoma; o problema é não haver responsáveis, processos e
// indicadores para recolher a informação.
export default function ProblemasESG() {
  const { lang } = useLang()
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const { itens, soLeitura, juntar, alterar, remover } = useLista('problemas')
  const [novo, setNovo] = useState(null)

  const L = lang === 'de' ? {
    titulo: 'Konkrete Probleme', sub: 'Von Symptomen zu konkreten Problemen: Symptom → Ursache → Auswirkung. Ergibt die Karte der Prioritäten und Lücken.',
    novo: '+ Problem', tema: 'Thema', semTema: '— ohne Thema —', sintoma: 'Symptom', causa: 'Ursache', impacto: 'Auswirkung',
    sintomaPh: 'z. B. „Wir haben keine Nachhaltigkeitsdaten“', guardar: 'Hinzufügen', cancelar: 'Abbrechen', remover: 'Entfernen', confirmar: 'Problem entfernen?', vazio: 'Noch keine Probleme erfasst.',
  } : lang === 'en' ? {
    titulo: 'Concrete problems', sub: 'From symptoms to concrete problems: symptom → cause → impact. This becomes the map of priorities and gaps.',
    novo: '+ Problem', tema: 'Topic', semTema: '— no topic —', sintoma: 'Symptom', causa: 'Cause', impacto: 'Impact',
    sintomaPh: 'e.g. “We have no sustainability data”', guardar: 'Add', cancelar: 'Cancel', remover: 'Remove', confirmar: 'Remove this problem?', vazio: 'No problems recorded yet.',
  } : {
    titulo: 'Problemas concretos', sub: 'De sintomas a problemas concretos: sintoma → causa → impacto. É o mapa de temas prioritários e lacunas.',
    novo: '+ Problema', tema: 'Tema', semTema: '— sem tema —', sintoma: 'Sintoma', causa: 'Causa', impacto: 'Impacto',
    sintomaPh: 'ex.: "Não temos dados de sustentabilidade"', guardar: 'Juntar', cancelar: 'Cancelar', remover: 'Remover', confirmar: 'Remover este problema?', vazio: 'Ainda não há problemas registados.',
  }

  const input = { width: '100%', boxSizing: 'border-box', padding: '9px 11px', borderRadius: '9px', border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.heading, fontSize: '13px', fontFamily: t.fontBody }
  const grelha = { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: '10px' }
  const seletorTema = (valor, aoMudar) => (
    <select value={valor || ''} onChange={e => aoMudar(e.target.value)} aria-label={L.tema} style={{ ...input, width: 'auto', minWidth: '200px', cursor: 'pointer' }}>
      <option value="">{L.semTema}</option>
      {ESG_TOPICS.map(tp => <option key={tp.key} value={tp.key}>{topicLabel(tp, lang)}</option>)}
    </select>
  )

  return (
    <CartaoMetodo titulo={L.titulo} sub={L.sub}
      acao={!soLeitura && !novo && <button onClick={() => setNovo({ tema: '', sintoma: '', causa: '', impacto: '' })} style={{ padding: '9px 16px', borderRadius: '10px', border: 'none', background: t.btnBg, color: t.btnInk, fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>{L.novo}</button>}>
      {novo && (
        <div style={{ padding: '12px', borderRadius: '12px', background: t.softCardBg, marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {seletorTema(novo.tema, v => setNovo(p => ({ ...p, tema: v })))}
          <div style={grelha}>
            {[['sintoma', L.sintomaPh], ['causa', ''], ['impacto', '']].map(([k, ph]) => (
              <label key={k} style={{ fontSize: '12px', fontWeight: 700, color: t.heading }}>{L[k]}
                <textarea rows={3} value={novo[k]} placeholder={ph} onChange={e => setNovo(p => ({ ...p, [k]: e.target.value }))} style={{ ...input, marginTop: '4px', resize: 'vertical' }} />
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button disabled={!novo.sintoma.trim()} onClick={() => { juntar(novo); setNovo(null) }} style={{ padding: '9px 18px', borderRadius: '9px', border: 'none', background: t.btnBg, color: t.btnInk, fontWeight: 700, fontSize: '13px', cursor: 'pointer', opacity: novo.sintoma.trim() ? 1 : .5 }}>{L.guardar}</button>
            <button onClick={() => setNovo(null)} style={{ padding: '9px 14px', borderRadius: '9px', border: `1px solid ${t.cardBorder}`, background: 'transparent', color: t.textMuted, fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>{L.cancelar}</button>
          </div>
        </div>
      )}
      {itens.length === 0 && !novo && <div style={{ fontSize: '13px', color: t.subtle }}>{L.vazio}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {itens.map(p => {
          const tp = ESG_TOPICS.find(x => x.key === p.tema)
          return (
            <div key={p.id} style={{ borderTop: `1px solid ${t.rowBorder}`, paddingTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                {soLeitura
                  ? <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: t.chipBg, color: t.chipText }}>{tp ? topicLabel(tp, lang) : L.semTema}</span>
                  : seletorTema(p.tema, v => alterar(p.id, { tema: v }))}
                {!soLeitura && <button onClick={() => { if (window.confirm(L.confirmar)) remover(p.id) }} style={{ marginLeft: 'auto', padding: '5px 11px', borderRadius: '8px', border: `1px solid ${t.cardBorder}`, background: 'transparent', color: t.neg, fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}>{L.remover}</button>}
              </div>
              <div style={grelha}>
                {['sintoma', 'causa', 'impacto'].map(k => (
                  <CampoTexto key={k} rotulo={L[k]} linhas={3} valor={p[k]} soLeitura={soLeitura} aoGravar={v => alterar(p.id, { [k]: v })} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </CartaoMetodo>
  )
}
