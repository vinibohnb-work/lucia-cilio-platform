import { useLang } from '../context/LangContext'
import { useTheme } from '../context/ThemeContext'

// Aviso de valores estimados — pedido da Lúcia (sugestão do Filipe) para as
// páginas com cálculos fiscais: as Finanças podem considerar regras, taxas ou
// arredondamentos diferentes, e o valor final não pode ser imputado à plataforma.
// Usar no topo das páginas de cálculo (Dashboard, Rücklagen, Obrigações,
// Precificação, Planeamento Mensal), logo abaixo do cabeçalho.

export default function EstimateNote({ style }) {
  const { lang } = useLang()
  const { t } = useTheme()

  const txt = lang === 'de'
    ? 'Geschätzte Werte auf Basis der erfassten Buchungen. Bitte nicht als endgültig ansehen — bestätigen Sie die endgültigen Beträge immer mit der Steuerbehörde oder Ihrer zugelassenen Steuerberatung.'
    : lang === 'en'
    ? 'Estimated values based on the entries recorded. Please do not treat them as final — always confirm the final amounts with the tax authority or your certified accountant.'
    : 'Valores estimados a partir dos lançamentos introduzidos. Não os considere definitivos — confirme sempre os montantes finais com a autoridade tributária ou com o seu contabilista certificado.'

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '9px',
      marginBottom: '18px', padding: '11px 14px', borderRadius: '11px',
      background: t.softCardBg, border: `1px solid ${t.cardBorder}`,
      fontSize: '11.5px', lineHeight: 1.5, color: t.textMuted,
      ...style,
    }}>
      <span style={{ flex: 'none', fontSize: '13px', lineHeight: 1.3 }}>ⓘ</span>
      <span>{txt}</span>
    </div>
  )
}
