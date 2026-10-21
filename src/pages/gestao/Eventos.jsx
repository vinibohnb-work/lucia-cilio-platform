import { useState, useEffect, useCallback } from 'react'
import QRCode from 'qrcode'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'
import { dataCurta } from '../../lib/formato'
import { Cartao, Botao, Chip, Vazio, useCampos } from '../../portal/ui'

// Eventos (pedido da Lúcia, 20/10): a área de participantes do evento, em vez
// de crachás. No dia, quem está na sala lê o QR code, escreve o nome, cria o
// perfil e vê os outros (/momentos/participantes, migração 048, api/evento.js).
// Aqui a equipa tem o QR para imprimir ou projetar, os dias em que a área está
// aberta e quem entrou. Trocar o código invalida o QR antigo (se tiver sido
// partilhado fora da sala, por exemplo).

const BUCKET = 'eventos'
const ORIGEM = typeof window !== 'undefined' ? window.location.origin : ''
const linkQR = (codigo) => `${ORIGEM}/momentos/participantes/#c=${codigo}`
const novoCodigo = () => {
  const b = new Uint8Array(12)
  crypto.getRandomValues(b)
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
const primeiroNome = (n) => String(n || '').trim().split(/\s+/)[0] || ''

export default function Eventos() {
  const { t } = useTheme()
  const c = useCampos()
  const [evento, setEvento] = useState(null)
  const [pessoas, setPessoas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [qr, setQr] = useState('')
  const [msg, setMsg] = useState({ tom: '', texto: '' })
  const [aRemover, setARemover] = useState(null)
  const [trocar, setTrocar] = useState(false)

  const avisar = (tom, texto) => { setMsg({ tom, texto }); if (tom !== 'erro') setTimeout(() => setMsg({ tom: '', texto: '' }), 3500) }

  const carregar = useCallback(async () => {
    const { data: evs } = await supabase.from('eventos').select('*').order('data', { ascending: false })
    const ev = (evs || [])[0] || null
    setEvento(ev)
    if (ev) {
      const { data } = await supabase.from('evento_participantes')
        .select('id, nome, negocio, localidade, partilhar, foto_path, ultimo_acesso, created_at').eq('evento_id', ev.id).order('nome')
      setPessoas(data || [])
      if (ev.codigo) setQr(await QRCode.toDataURL(linkQR(ev.codigo), { width: 520, margin: 2, color: { dark: '#0E3D33', light: '#FFFFFF' } }))
    }
    setCarregando(false)
  }, [])
  useEffect(() => { carregar() }, [carregar])

  async function alterarEvento(patch, ok) {
    const { error, count } = await supabase.from('eventos').update(patch, { count: 'exact' }).eq('id', evento.id)
    if (error || count === 0) { avisar('erro', 'Não foi possível guardar.'); return }
    avisar('ok', ok)
    carregar()
  }

  async function copiar(texto) {
    try { await navigator.clipboard.writeText(texto); avisar('ok', 'Link copiado.') }
    catch { window.prompt('Copie o link:', texto) }
  }

  async function remover(p) {
    if (p.foto_path) await supabase.storage.from(BUCKET).remove([p.foto_path])
    const { error, count } = await supabase.from('evento_participantes').delete({ count: 'exact' }).eq('id', p.id)
    setARemover(null)
    if (error || count === 0) { avisar('erro', 'Não foi possível remover.'); return }
    avisar('ok', `${p.nome} removido da área de participantes.`)
    carregar()
  }

  if (carregando) return <div style={{ color: t.subtle, padding: '20px 0' }}>A carregar…</div>
  if (!evento) return <Vazio>Ainda não há eventos. Falta correr a migração 048 na base de dados.</Vazio>

  const partilham = pessoas.filter(p => p.partilhar).length
  const th = { textAlign: 'left', padding: '9px 10px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: t.textMuted, borderBottom: `1px solid ${t.cardBorder}` }
  const td = { padding: '10px', fontSize: '13px', color: t.text, borderBottom: `1px solid ${t.rowBorder}`, verticalAlign: 'middle' }
  const rotulo = { display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.04em' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h1 className="so-leitores">Eventos</h1>

      <Cartao titulo={`${evento.nome} · ${dataCurta(evento.data)}`}
        acao={<a href="/momentos/" target="_blank" rel="noopener" style={{ fontSize: '12.5px', fontWeight: 700, color: t.accentText }}>Ver a landing ↗</a>}>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: '0 0 auto', textAlign: 'center' }}>
            {qr && <img src={qr} alt="QR code da área de participantes" width="220" height="220" style={{ display: 'block', borderRadius: '12px', border: `1px solid ${t.cardBorder}`, background: '#fff' }} />}
            {qr && <a href={qr} download={`qr-${evento.id}.png`} style={{ display: 'inline-block', marginTop: '8px', fontSize: '12.5px', fontWeight: 700, color: t.accentText }}>Descarregar o QR (PNG)</a>}
          </div>
          <div style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ margin: 0, fontSize: '13.5px', color: t.text, lineHeight: 1.5 }}>
              Imprima ou projete este QR à entrada. Quem o ler escreve o nome, cria o perfil e vê os outros participantes. Sem crachás, sem contas.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <label style={rotulo}>Abre a
                <input type="date" value={evento.aberto_de || ''} onChange={e => alterarEvento({ aberto_de: e.target.value || null }, 'Data de abertura guardada.')} style={{ ...c.input, width: 'auto' }} />
              </label>
              <label style={rotulo}>Fecha depois de
                <input type="date" value={evento.aberto_ate || ''} onChange={e => alterarEvento({ aberto_ate: e.target.value || null }, 'Data de fecho guardada.')} style={{ ...c.input, width: 'auto' }} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Botao onClick={() => copiar(linkQR(evento.codigo))}>Copiar o link do QR</Botao>
              {trocar ? (
                <span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px' }}>O QR atual deixa de funcionar. Continuar?</span>
                  <Botao onClick={() => { setTrocar(false); alterarEvento({ codigo: novoCodigo() }, 'Novo QR gerado. O anterior deixou de funcionar.') }} estilo={{ color: t.neg }}>Gerar novo QR</Botao>
                  <Botao onClick={() => setTrocar(false)}>Cancelar</Botao>
                </span>
              ) : <Botao onClick={() => setTrocar(true)}>Gerar novo QR</Botao>}
            </div>
            <div style={{ display: 'flex', gap: '22px', flexWrap: 'wrap', fontSize: '13px', color: t.textMuted }}>
              <span><strong style={{ fontSize: '20px', color: t.heading }}>{pessoas.length}</strong> entraram</span>
              <span><strong style={{ fontSize: '20px', color: t.heading }}>{partilham}</strong> partilham o perfil</span>
            </div>
            {msg.texto && <div role="status" style={{ fontSize: '13px', fontWeight: 600, color: msg.tom === 'erro' ? t.neg : t.pos }}>{msg.texto}</div>}
          </div>
        </div>
      </Cartao>

      <Cartao titulo="Quem entrou" semPadding>
        {pessoas.length === 0
          ? <div style={{ padding: '0 20px 20px' }}><Vazio>Ainda ninguém entrou. A lista enche-se no dia, à medida que as pessoas leem o QR.</Vazio></div>
          : (
            <div className="table-scroll">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={th}>Nome</th><th style={th}>Negócio</th><th style={th}>Perfil</th><th style={th}>Entrou</th><th style={th}><span className="so-leitores">Ações</span></th></tr></thead>
                <tbody>
                  {pessoas.map(p => (
                    <tr key={p.id}>
                      <td style={{ ...td, fontWeight: 700, color: t.heading }}>{p.nome}</td>
                      <td style={td}>{p.negocio || '—'}{p.localidade ? <span style={{ color: t.subtle }}> · {p.localidade}</span> : null}</td>
                      <td style={td}>{p.partilhar ? <Chip tom="ok">Partilha</Chip> : <Chip>Não partilha</Chip>}</td>
                      <td style={{ ...td, fontVariantNumeric: 'tabular-nums' }}>{dataCurta(p.created_at.slice(0, 10))}</td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>
                        {aRemover === p.id ? (
                          <span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px' }}>Remover {primeiroNome(p.nome)}?</span>
                            <Botao onClick={() => remover(p)} estilo={{ color: t.neg }}>Remover</Botao>
                            <Botao onClick={() => setARemover(null)}>Cancelar</Botao>
                          </span>
                        ) : <Botao onClick={() => setARemover(p.id)} estilo={{ color: t.neg }}>Remover</Botao>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </Cartao>
      <p style={{ fontSize: '12px', color: t.subtle, margin: 0 }}>
        Só aparece aos outros quem marcar "Partilhar". Se alguém entrar sem ser do evento, remova-o aqui; se o QR circular fora da sala, gere um novo.
      </p>
    </div>
  )
}
