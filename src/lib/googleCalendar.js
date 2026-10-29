// "Adicionar ao Google Calendar" (reunião de 29/10, opção 1): abre o Google
// Calendar de quem clica com a reunião já preenchida; a pessoa só carrega em
// Guardar. Sem login Google na plataforma, sem chaves, funciona com qualquer
// conta Gmail. As horas são de Lisboa (ctz), escritas sem fuso.

const dois = (n) => String(n).padStart(2, '0')
const carimbo = (d) => `${d.getUTCFullYear()}${dois(d.getUTCMonth() + 1)}${dois(d.getUTCDate())}T${dois(d.getUTCHours())}${dois(d.getUTCMinutes())}00`

export function linkGoogleCalendar({ titulo, data, hora, duracaoMin = 60, detalhes = '', local = '' }) {
  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data) || !/^\d{2}:\d{2}/.test(hora || '')) return null
  const [a, m, d] = data.split('-').map(Number)
  const [h, mi] = hora.split(':').map(Number)
  // As contas fazem-se em UTC só para somar minutos sem depender do fuso do browser
  const ini = new Date(Date.UTC(a, m - 1, d, h, mi))
  const fim = new Date(ini.getTime() + (Number(duracaoMin) || 60) * 60000)
  const p = new URLSearchParams({ action: 'TEMPLATE', text: titulo || 'Reunião', dates: `${carimbo(ini)}/${carimbo(fim)}`, ctz: 'Europe/Lisbon' })
  if (detalhes) p.set('details', detalhes)
  if (local) p.set('location', local)
  return `https://calendar.google.com/calendar/render?${p.toString()}`
}
