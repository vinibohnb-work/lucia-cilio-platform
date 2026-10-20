import { useState } from 'react'
import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useAlvoESG } from '../../context/AlvoESGContext'
import { useMetodo, useLista } from '../../lib/useMetodoESG'
import { CampoTexto, CartaoMetodo } from '../../components/esg/MetodoUI'
import DocsBrowser from '../../components/DocsBrowser'
import { PERGUNTAS_AVALIACAO, txt } from '../../data/esgMetodo'
import { dataCurta } from '../../lib/formato'

// "Medir → Evoluir" no método da Lúcia (documento de 15/10): as reuniões de
// acompanhamento (para o plano não ficar "na gaveta"), o feedback do cliente
// — pedido com intervalo de três meses, "longe da euforia da entrega" —, a
// avaliação final (o que mudou e qual o próximo passo) e o repositório de
// documentos e evidências do caso.
const hoje = () => new Date().toISOString().slice(0, 10)

export default function AcompanhamentoESG() {
  const { lang } = useLang()
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const { caso, soLeitura: leituraCaso } = useAlvoESG()
  const { metodo, gravar, soLeitura } = useMetodo()
  const reunioes = useLista('reunioes')
  const feedback = useLista('feedback')
  const aval = metodo.avaliacao || {}
  const [novaReuniao, setNovaReuniao] = useState(null)
  const [novoFeedback, setNovoFeedback] = useState(null)

  const L = lang === 'de' ? {
    titulo: 'Begleitung', reunioesT: 'Begleittermine', reunioesSub: 'Was besprochen, entschieden und als Nächstes vereinbart wurde.',
    novaR: '+ Termin', data: 'Datum', resumo: 'Zusammenfassung', decisoes: 'Entscheidungen', proximos: 'Nächste Schritte',
    feedT: 'Kundenfeedback', feedSub: 'Bei monatlicher Begleitung vierteljährlich fragen — mit Abstand zur Übergabe, damit es ehrlich ist.',
    novoF: '+ Feedback', nota: 'Zufriedenheit (1–5)', mudou: 'Was hat sich für Sie verändert?', melhorar: 'Was können wir verbessern?',
    avalT: 'Bewertung und nächster Schritt', avalSub: 'Am Ende jedes Zyklus. Der Bericht ist das Ergebnis eines Prozesses — nicht der Prozess.',
    docsT: 'Dokumente und Nachweise', docsSub: 'Richtlinien, Verbräuche, Fotos, Protokolle — nur für das Team sichtbar.',
    guardar: 'Hinzufügen', cancelar: 'Abbrechen', remover: 'Entfernen', confirmar: 'Eintrag entfernen?', vazioR: 'Noch keine Termine.', vazioF: 'Noch kein Feedback.',
  } : lang === 'en' ? {
    titulo: 'Follow-up', reunioesT: 'Follow-up meetings', reunioesSub: 'What was discussed, decided and agreed as next steps.',
    novaR: '+ Meeting', data: 'Date', resumo: 'Summary', decisoes: 'Decisions', proximos: 'Next steps',
    feedT: 'Client feedback', feedSub: 'For monthly clients, ask quarterly — away from the delivery high, so it is honest.',
    novoF: '+ Feedback', nota: 'Satisfaction (1–5)', mudou: 'What changed for you?', melhorar: 'What can we improve?',
    avalT: 'Evaluation and next step', avalSub: 'At the end of each cycle. The report is the result of a process — not the process.',
    docsT: 'Documents and evidence', docsSub: 'Policies, consumption, photos, minutes — visible to the team only.',
    guardar: 'Add', cancelar: 'Cancel', remover: 'Remove', confirmar: 'Remove this entry?', vazioR: 'No meetings yet.', vazioF: 'No feedback yet.',
  } : {
    titulo: 'Acompanhamento', reunioesT: 'Reuniões de acompanhamento', reunioesSub: 'O que se falou, o que se decidiu e os próximos passos combinados.',
    novaR: '+ Reunião', data: 'Data', resumo: 'Resumo', decisoes: 'Decisões', proximos: 'Próximos passos',
    feedT: 'Feedback do cliente', feedSub: 'Aos clientes de acompanhamento mensal, pedir de três em três meses — longe da euforia da entrega, para ser honesto.',
    novoF: '+ Feedback', nota: 'Satisfação (1–5)', mudou: 'O que mudou para si?', melhorar: 'O que podemos melhorar?',
    avalT: 'Avaliação e próximo passo', avalSub: 'No fim de cada ciclo. O relatório é o resultado de um processo — não é o processo.',
    docsT: 'Documentos e evidências', docsSub: 'Políticas, consumos, fotografias, atas — só a equipa os vê.',
    guardar: 'Juntar', cancelar: 'Cancelar', remover: 'Remover', confirmar: 'Remover este registo?', vazioR: 'Ainda não há reuniões.', vazioF: 'Ainda não há feedback.',
  }

  const input = { width: '100%', boxSizing: 'border-box', padding: '9px 11px', borderRadius: '9px', border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.heading, fontSize: '13px', fontFamily: t.fontBody }
  const btnP = { padding: '9px 16px', borderRadius: '10px', border: 'none', background: t.btnBg, color: t.btnInk, fontWeight: 700, fontSize: '13px', cursor: 'pointer' }
  const btnS = { padding: '9px 14px', borderRadius: '9px', border: `1px solid ${t.cardBorder}`, background: 'transparent', color: t.textMuted, fontWeight: 600, fontSize: '13px', cursor: 'pointer' }
  const btnRemover = (lista, id) => !soLeitura && (
    <button onClick={() => { if (window.confirm(L.confirmar)) lista.remover(id) }} style={{ marginLeft: 'auto', padding: '5px 11px', borderRadius: '8px', border: `1px solid ${t.cardBorder}`, background: 'transparent', color: t.neg, fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}>{L.remover}</button>
  )
  const grelha3 = { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: '10px' }
  const ordenadas = (l) => [...l].sort((a, b) => String(b.data || '').localeCompare(String(a.data || '')))

  return (
    <div style={{ width: '100%', fontFamily: t.fontBody }}>
      <h1 className="so-leitores">{L.titulo}</h1>

      <CartaoMetodo titulo={L.reunioesT} sub={L.reunioesSub}
        acao={!soLeitura && !novaReuniao && <button style={btnP} onClick={() => setNovaReuniao({ data: hoje(), resumo: '', decisoes: '', proximos: '' })}>{L.novaR}</button>}>
        {novaReuniao && (
          <div style={{ padding: '12px', borderRadius: '12px', background: t.softCardBg, marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: t.heading, maxWidth: '200px' }}>{L.data}
              <input type="date" value={novaReuniao.data} onChange={e => setNovaReuniao(p => ({ ...p, data: e.target.value }))} style={{ ...input, marginTop: '4px' }} /></label>
            <div style={grelha3}>
              {['resumo', 'decisoes', 'proximos'].map(k => (
                <label key={k} style={{ fontSize: '12px', fontWeight: 700, color: t.heading }}>{L[k]}
                  <textarea rows={3} value={novaReuniao[k]} onChange={e => setNovaReuniao(p => ({ ...p, [k]: e.target.value }))} style={{ ...input, marginTop: '4px', resize: 'vertical' }} /></label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ ...btnP, opacity: novaReuniao.data ? 1 : .5 }} disabled={!novaReuniao.data} onClick={() => { reunioes.juntar(novaReuniao); setNovaReuniao(null) }}>{L.guardar}</button>
              <button style={btnS} onClick={() => setNovaReuniao(null)}>{L.cancelar}</button>
            </div>
          </div>
        )}
        {reunioes.itens.length === 0 && !novaReuniao && <div style={{ fontSize: '13px', color: t.subtle }}>{L.vazioR}</div>}
        {ordenadas(reunioes.itens).map(r => (
          <div key={r.id} style={{ borderTop: `1px solid ${t.rowBorder}`, paddingTop: '12px', marginTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <strong style={{ fontSize: '13px', color: t.heading }}>{dataCurta(r.data, lang)}</strong>
              {btnRemover(reunioes, r.id)}
            </div>
            <div style={grelha3}>
              {['resumo', 'decisoes', 'proximos'].map(k => (
                <CampoTexto key={k} rotulo={L[k]} linhas={3} valor={r[k]} soLeitura={soLeitura} aoGravar={v => reunioes.alterar(r.id, { [k]: v })} />
              ))}
            </div>
          </div>
        ))}
      </CartaoMetodo>

      <CartaoMetodo titulo={L.feedT} sub={L.feedSub}
        acao={!soLeitura && !novoFeedback && <button style={btnP} onClick={() => setNovoFeedback({ data: hoje(), nota: '', mudou: '', melhorar: '' })}>{L.novoF}</button>}>
        {novoFeedback && (
          <div style={{ padding: '12px', borderRadius: '12px', background: t.softCardBg, marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: t.heading, width: '180px' }}>{L.data}
                <input type="date" value={novoFeedback.data} onChange={e => setNovoFeedback(p => ({ ...p, data: e.target.value }))} style={{ ...input, marginTop: '4px' }} /></label>
              <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                <legend style={{ fontSize: '12px', fontWeight: 700, color: t.heading, marginBottom: '4px' }}>{L.nota}</legend>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button" aria-pressed={novoFeedback.nota === n} onClick={() => setNovoFeedback(p => ({ ...p, nota: n }))}
                      style={{ width: '44px', height: '44px', borderRadius: '10px', border: `1.5px solid ${novoFeedback.nota === n ? t.accent : t.cardBorder}`, background: novoFeedback.nota === n ? t.chipBg : t.cardBg, color: t.heading, fontWeight: 800, cursor: 'pointer' }}>{n}</button>
                  ))}
                </div>
              </fieldset>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
              {['mudou', 'melhorar'].map(k => (
                <label key={k} style={{ fontSize: '12px', fontWeight: 700, color: t.heading }}>{L[k]}
                  <textarea rows={3} value={novoFeedback[k]} onChange={e => setNovoFeedback(p => ({ ...p, [k]: e.target.value }))} style={{ ...input, marginTop: '4px', resize: 'vertical' }} /></label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ ...btnP, opacity: novoFeedback.data ? 1 : .5 }} disabled={!novoFeedback.data} onClick={() => { feedback.juntar(novoFeedback); setNovoFeedback(null) }}>{L.guardar}</button>
              <button style={btnS} onClick={() => setNovoFeedback(null)}>{L.cancelar}</button>
            </div>
          </div>
        )}
        {feedback.itens.length === 0 && !novoFeedback && <div style={{ fontSize: '13px', color: t.subtle }}>{L.vazioF}</div>}
        {ordenadas(feedback.itens).map(f => (
          <div key={f.id} style={{ borderTop: `1px solid ${t.rowBorder}`, paddingTop: '12px', marginTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <strong style={{ fontSize: '13px', color: t.heading }}>{dataCurta(f.data, lang)}</strong>
              {f.nota ? <span style={{ fontSize: '12px', fontWeight: 800, padding: '2px 10px', borderRadius: '20px', background: t.chipBg, color: t.chipText }}>{f.nota}/5</span> : null}
              {btnRemover(feedback, f.id)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
              {['mudou', 'melhorar'].map(k => (
                <CampoTexto key={k} rotulo={L[k]} linhas={2} valor={f[k]} soLeitura={soLeitura} aoGravar={v => feedback.alterar(f.id, { [k]: v })} />
              ))}
            </div>
          </div>
        ))}
      </CartaoMetodo>

      <CartaoMetodo titulo={L.avalT} sub={L.avalSub}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
          {PERGUNTAS_AVALIACAO.map(p => (
            <CampoTexto key={p.key} rotulo={txt(p.t, lang)} linhas={3} valor={aval[p.key]} soLeitura={soLeitura}
              aoGravar={v => gravar('avaliacao', { ...aval, [p.key]: v })} />
          ))}
        </div>
      </CartaoMetodo>

      {/* Repositório do caso: pasta esg/<id> no bucket client-docs. Só a equipa —
          o cliente não tem leitura nesta pasta, por isso nem aparece na área dele. */}
      {!leituraCaso && (
        <CartaoMetodo titulo={L.docsT} sub={L.docsSub}>
          <DocsBrowser userId={`esg/${caso.id}`} />
        </CartaoMetodo>
      )}
    </div>
  )
}
