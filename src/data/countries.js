// Lista de países (ISO 3166-1 alpha-2). Os nomes são localizados em runtime
// via Intl.DisplayNames (PT/DE), evitando manter centenas de traduções à mão.

export const COUNTRY_CODES = [
  'AF','AX','AL','DZ','AS','AD','AO','AI','AQ','AG','AR','AM','AW','AU','AT','AZ',
  'BS','BH','BD','BB','BY','BE','BZ','BJ','BM','BT','BO','BA','BW','BR','IO','BN',
  'BG','BF','BI','KH','CM','CA','CV','KY','CF','TD','CL','CN','CO','KM','CG','CD',
  'CR','CI','HR','CU','CY','CZ','DK','DJ','DM','DO','EC','EG','SV','GQ','ER','EE',
  'SZ','ET','FJ','FI','FR','GF','PF','GA','GM','GE','DE','GH','GI','GR','GL','GD',
  'GP','GU','GT','GG','GN','GW','GY','HT','HN','HK','HU','IS','IN','ID','IR','IQ',
  'IE','IM','IL','IT','JM','JP','JE','JO','KZ','KE','KI','KP','KR','KW','KG','LA',
  'LV','LB','LS','LR','LY','LI','LT','LU','MO','MG','MW','MY','MV','ML','MT','MH',
  'MQ','MR','MU','MX','FM','MD','MC','MN','ME','MS','MA','MZ','MM','NA','NR','NP',
  'NL','NC','NZ','NI','NE','NG','MK','NO','OM','PK','PW','PS','PA','PG','PY','PE',
  'PH','PL','PT','PR','QA','RE','RO','RU','RW','BL','KN','LC','MF','PM','VC','WS',
  'SM','ST','SA','SN','RS','SC','SL','SG','SK','SI','SB','SO','ZA','SS','ES','LK',
  'SD','SR','SE','CH','SY','TW','TJ','TZ','TH','TL','TG','TO','TT','TN','TR','TM',
  'TC','TV','UG','UA','AE','GB','US','UY','UZ','VU','VA','VE','VN','VG','VI','YE',
  'ZM','ZW',
]

function displayNames(lang) {
  try {
    return new Intl.DisplayNames([lang === 'de' ? 'de' : 'pt-PT'], { type: 'region' })
  } catch {
    return null
  }
}

export function countryName(code, lang) {
  if (!code) return ''
  const dn = displayNames(lang)
  try { return dn?.of(code.toUpperCase()) || code.toUpperCase() }
  catch { return code.toUpperCase() }
}

// Emoji de bandeira a partir do código (degrada para as letras em sistemas
// sem glifos de bandeira, ex: Windows — por isso mostramos sempre o nome ao lado).
export function flagEmoji(code) {
  if (!code || code.length !== 2) return ''
  return code.toUpperCase().replace(/[A-Z]/g, c => String.fromCodePoint(127397 + c.charCodeAt(0)))
}

// Opções ordenadas pelo nome localizado.
export function getCountryOptions(lang) {
  const dn = displayNames(lang)
  return COUNTRY_CODES
    .map(code => ({ code, name: (() => { try { return dn?.of(code) || code } catch { return code } })() }))
    .sort((a, b) => a.name.localeCompare(b.name, lang === 'de' ? 'de' : 'pt'))
}
