import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'
import { Cartao, Botao, Chip, useCampos } from '../../portal/ui'
import { BUCKET_PAGINA, PAGINA_VAZIA, caminhoNoBucket, linkPagina } from '../../lib/paginaEvento'

// Página do evento (LUC-242, migração 065). A Lúcia perguntou a 29/10 "como é que eu vou
// fazer para mudar os palestrantes?": aqui ela escreve o conteúdo da landing de cada edição
// (tema, horas, local, preço, Luma, palestrantes com foto, programa, imagem de partilha).
// lcoffice.pt/momentos/ mostra a edição marcada como atual; cada edição tem o seu endereço
// (lcoffice.pt/momentos/?e=<id>). Fixo no código: visual, "O evento", "Quem organiza", FAQ, rodapé.
// As fotos vão para o bucket público 'eventos-pagina', na pasta do evento.

const TIPOS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
const MAX_FOTO = 3 * 1024 * 1024
const NOVO_ORADOR = { nome: '', curto: '', area: '', foto: '', selo: '', texto: '', topicos: [], instagram: '' }
const NOVA_LINHA = { hora: '', tipo: '', titulo: '', quem: '' }

const mover = (lista, i, d) => {
  const j = i + d
  if (j < 0 || j >= lista.length) return lista
  const n = [...lista];[n[i], n[j]] = [n[j], n[i]]
  return n
}
const linhas = (txt) => String(txt || '').split('\n').map(s => s.trim()).filter(Boolean)

export default function PaginaEvento({ evento, avisar, aoMudar, aoDuplicar }) {
  const { t } = useTheme()
  const c = useCampos()
  const [p, setP] = useState(() => ({ ...PAGINA_VAZIA, ...(evento.pagina || {}) }))
  const [sujo, setSujo] = useState(false)
  const [aGravar, setAGravar] = useState(false)
  const [aEnviar, setAEnviar] = useState('')

  const muda = (k, v) => { setP(x => ({ ...x, [k]: v })); setSujo(true) }
  const campo = (k) => (e) => muda(k, e.target.value)
  const mudaItem = (k, i, patch) => muda(k, p[k].map((x, j) => j === i ? { ...x, ...patch } : x))
  const rotulo = { display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.04em', minWidth: 0 }
  const grelha = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '12px' }
  const area = { ...c.input, minHeight: '76px', resize: 'vertical', fontFamily: 'inherit' }
  const ajuda = { fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: t.subtle }
  const subtitulo = { margin: '18px 0 10px', fontSize: '13px', fontWeight: 800, color: t.heading }
  const caixa = { border: `1px solid ${t.cardBorder}`, borderRadius: '12px', padding: '14px', display: 'grid', gap: '10px' }

  if (!evento.pagina) {
    return (
      <Cartao titulo="Página do evento">
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <p style={{ margin: 0, flex: '1 1 320px', fontSize: '13.5px', color: t.text, lineHeight: 1.5 }}>
            Este evento ainda não tem página no lcoffice.pt. O mais rápido é abrir uma edição anterior e usar "Duplicar edição"; ou comece uma página em branco.
          </p>
          <Botao variante="primario" onClick={() => aoMudar({ pagina: PAGINA_VAZIA }, 'Página criada. Preencha e guarde.')}>Criar página em branco</Botao>
        </div>
      </Cartao>
    )
  }

  async function guardar() {
    const luma = p.luma_url.trim()
    if (luma && !/^https:\/\//i.test(luma)) { avisar('erro', 'O link da Luma tem de começar por https://'); return }
    const lat = p.mapa_lat === '' || p.mapa_lat == null ? null : Number(p.mapa_lat)
    const lng = p.mapa_lng === '' || p.mapa_lng == null ? null : Number(p.mapa_lng)
    if ((lat !== null && !Number.isFinite(lat)) || (lng !== null && !Number.isFinite(lng))) { avisar('erro', 'As coordenadas do mapa têm de ser números (ex.: 38.72002).'); return }
    const limpo = {
      ...p, luma_url: luma, mapa_lat: lat, mapa_lng: lng,
      programa: p.programa.filter(x => x.titulo.trim()),
      palestrantes: p.palestrantes.filter(x => x.nome.trim()),
    }
    setAGravar(true)
    const ok = await aoMudar({ pagina: limpo }, 'Página guardada. Já aparece no endereço da edição.')
    setAGravar(false)
    if (ok) { setP(limpo); setSujo(false) }
  }

  // Foto: envia para a pasta da edição e apaga a anterior (se era desta edição)
  async function enviarFoto(ficheiro, anterior, aplicar, chave) {
    if (!ficheiro) return
    if (!TIPOS[ficheiro.type]) { avisar('erro', 'Use uma imagem JPEG, PNG ou WebP.'); return }
    if (ficheiro.size > MAX_FOTO) { avisar('erro', 'A imagem tem mais de 3 MB. Reduza-a e tente de novo.'); return }
    setAEnviar(chave)
    const caminho = `${evento.id}/${crypto.randomUUID()}.${TIPOS[ficheiro.type]}`
    const { error } = await supabase.storage.from(BUCKET_PAGINA).upload(caminho, ficheiro, { contentType: ficheiro.type })
    setAEnviar('')
    if (error) { avisar('erro', 'Não foi possível enviar a foto.'); return }
    const velho = caminhoNoBucket(anterior, evento.id)
    if (velho) await supabase.storage.from(BUCKET_PAGINA).remove([velho])
    aplicar(supabase.storage.from(BUCKET_PAGINA).getPublicUrl(caminho).data.publicUrl)
    avisar('ok', 'Foto enviada. Carregue em "Guardar página" para publicar.')
  }

  async function tornarAtual() {
    if (sujo && !window.confirm('Há alterações por guardar. Mostrar a versão guardada desta edição em lcoffice.pt/momentos?')) return
    const { error } = await supabase.from('eventos').update({ pagina_atual: false }).eq('pagina_atual', true).neq('id', evento.id)
    if (error) { avisar('erro', 'Não foi possível trocar a edição atual.'); return }
    await aoMudar({ pagina_atual: true }, 'Esta edição passou a ser a de lcoffice.pt/momentos.', true)
  }

  const fotoCampo = (url, chave, aplicar, legenda) => (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
      {url ? <img src={url} alt="" width="64" height="80" style={{ objectFit: 'cover', borderRadius: '8px', border: `1px solid ${t.cardBorder}` }} /> : <span style={{ width: 64, height: 80, borderRadius: 8, background: t.softCardBg, display: 'inline-block' }} />}
      <label style={{ ...rotulo, cursor: 'pointer' }}>{legenda}
        <input type="file" accept="image/jpeg,image/png,image/webp" disabled={!!aEnviar} onChange={e => { enviarFoto(e.target.files?.[0], url, aplicar, chave); e.target.value = '' }} style={{ fontSize: '13px', textTransform: 'none' }} />
        {aEnviar === chave && <span style={ajuda}>A enviar…</span>}
      </label>
    </div>
  )

  return (
    <Cartao titulo="Página do evento"
      acao={<span style={{ display: 'inline-flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        {evento.pagina_atual ? <Chip tom="ok">Em lcoffice.pt/momentos</Chip> : <Botao onClick={tornarAtual}>Mostrar em lcoffice.pt/momentos</Botao>}
        <a href={linkPagina(evento.id)} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12.5px', fontWeight: 700, color: t.accentText }}>Ver a página ↗</a>
      </span>}>
      <p style={{ margin: '0 0 12px', fontSize: '13px', color: t.textMuted, lineHeight: 1.5 }}>
        A data e o nome vêm do cartão "Evento", acima. O visual, "O evento", "Quem organiza", as perguntas frequentes e o rodapé são iguais em todas as edições.
      </p>

      <h3 style={subtitulo}>Destaque</h3>
      <div style={grelha}>
        <label style={rotulo}>Tema (1.ª linha)<input value={p.tema_1} onChange={campo('tema_1')} maxLength={80} placeholder="Ser Empreendedor:" style={c.input} /></label>
        <label style={rotulo}>Tema (2.ª linha, dourada)<input value={p.tema_2} onChange={campo('tema_2')} maxLength={120} style={c.input} /></label>
        <label style={rotulo}>Começa<input type="time" value={p.hora_inicio} onChange={campo('hora_inicio')} style={c.input} /><span style={ajuda}>A contagem decrescente usa esta hora.</span></label>
        <label style={rotulo}>Acaba<input type="time" value={p.hora_fim} onChange={campo('hora_fim')} style={c.input} /></label>
        <label style={rotulo}>Nota da hora<input value={p.rececao} onChange={campo('rececao')} maxLength={60} placeholder="Receção às 15h" style={c.input} /></label>
      </div>

      <h3 style={subtitulo}>Local</h3>
      <div style={grelha}>
        <label style={rotulo}>Espaço<input value={p.local_nome} onChange={campo('local_nome')} maxLength={80} placeholder="District Space" style={c.input} /></label>
        <label style={rotulo}>Cidade<input value={p.local_cidade} onChange={campo('local_cidade')} maxLength={60} placeholder="Lisboa" style={c.input} /></label>
        <label style={{ ...rotulo, gridColumn: '1 / -1' }}>Morada<input value={p.morada} onChange={campo('morada')} maxLength={200} style={c.input} /></label>
        <label style={rotulo}>Latitude (mapa)<input value={p.mapa_lat ?? ''} onChange={campo('mapa_lat')} inputMode="decimal" placeholder="38.72002" style={c.input} /></label>
        <label style={rotulo}>Longitude (mapa)<input value={p.mapa_lng ?? ''} onChange={campo('mapa_lng')} inputMode="decimal" placeholder="-9.14699" style={c.input} /><span style={ajuda}>No Google Maps: clique com o botão direito no local e copie os números. Sem eles, o mapa não aparece (fica o botão "Abrir no Google Maps").</span></label>
      </div>

      <h3 style={subtitulo}>Bilhete</h3>
      <div style={grelha}>
        <label style={rotulo}>Preço<input value={p.preco} onChange={campo('preco')} maxLength={20} placeholder="40 €" style={c.input} /></label>
        <label style={rotulo}>Link da Luma<input value={p.luma_url} onChange={campo('luma_url')} inputMode="url" autoCapitalize="off" placeholder="https://luma.com/…" style={c.input} /></label>
        <label style={{ ...rotulo, gridColumn: '1 / -1' }}>O que inclui (uma linha por item)<textarea value={p.inclui.join('\n')} onChange={e => muda('inclui', e.target.value.split('\n'))} onBlur={() => muda('inclui', linhas(p.inclui.join('\n')))} style={area} /></label>
      </div>

      <h3 style={subtitulo}>Palestrantes</h3>
      <label style={{ ...rotulo, marginBottom: '10px' }}>Título da secção<input value={p.oradores_titulo} onChange={campo('oradores_titulo')} maxLength={80} placeholder="Seis presenças. Experiências diferentes." style={c.input} /></label>
      <div style={{ display: 'grid', gap: '12px' }}>
        {p.palestrantes.map((o, i) => (
          <div key={i} style={caixa}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <strong style={{ color: t.heading, flex: 1 }}>{i + 1}. {o.nome || 'Novo palestrante'}{i === 0 && <span style={{ fontWeight: 400, color: t.subtle }}> · foto grande no topo</span>}</strong>
              <Botao variante="fantasma" onClick={() => muda('palestrantes', mover(p.palestrantes, i, -1))} disabled={i === 0} aria-label="Subir">↑</Botao>
              <Botao variante="fantasma" onClick={() => muda('palestrantes', mover(p.palestrantes, i, 1))} disabled={i === p.palestrantes.length - 1} aria-label="Descer">↓</Botao>
              <Botao variante="perigo" onClick={() => { if (window.confirm(`Retirar ${o.nome || 'este palestrante'} da página?`)) muda('palestrantes', p.palestrantes.filter((_, j) => j !== i)) }}>Retirar</Botao>
            </div>
            {fotoCampo(o.foto, 'o' + i, (url) => mudaItem('palestrantes', i, { foto: url }), 'Foto (retrato, JPEG/PNG/WebP até 3 MB)')}
            <div style={grelha}>
              <label style={rotulo}>Nome<input value={o.nome} onChange={e => mudaItem('palestrantes', i, { nome: e.target.value })} maxLength={80} style={c.input} /></label>
              <label style={rotulo}>Nome curto (na foto)<input value={o.curto} onChange={e => mudaItem('palestrantes', i, { curto: e.target.value })} maxLength={40} style={c.input} /></label>
              <label style={rotulo}>Área<input value={o.area} onChange={e => mudaItem('palestrantes', i, { area: e.target.value })} maxLength={60} placeholder="Liderança" style={c.input} /></label>
              <label style={rotulo}>Instagram<input value={o.instagram} onChange={e => mudaItem('palestrantes', i, { instagram: e.target.value })} maxLength={60} autoCapitalize="off" placeholder="@perfil" style={c.input} /></label>
              <label style={rotulo}>Selo (opcional)<input value={o.selo} onChange={e => mudaItem('palestrantes', i, { selo: e.target.value })} maxLength={40} placeholder="Convidado especial" style={c.input} /></label>
            </div>
            <label style={rotulo}>Texto<textarea value={o.texto} onChange={e => mudaItem('palestrantes', i, { texto: e.target.value })} maxLength={400} style={area} /></label>
            <label style={rotulo}>Tópicos (uma linha por tópico)<textarea value={(o.topicos || []).join('\n')} onChange={e => mudaItem('palestrantes', i, { topicos: e.target.value.split('\n') })} onBlur={() => mudaItem('palestrantes', i, { topicos: linhas((o.topicos || []).join('\n')) })} style={area} /></label>
          </div>
        ))}
        <div><Botao onClick={() => muda('palestrantes', [...p.palestrantes, { ...NOVO_ORADOR }])}>+ Juntar palestrante</Botao></div>
      </div>

      <h3 style={subtitulo}>Programa</h3>
      <label style={{ ...rotulo, marginBottom: '10px' }}>Frase do programa<input value={p.programa_resumo} onChange={campo('programa_resumo')} maxLength={200} style={c.input} /></label>
      <div style={{ display: 'grid', gap: '8px' }}>
        {p.programa.map((l, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 130px), 1fr))', gap: '8px', alignItems: 'end', paddingBottom: '8px', borderBottom: `1px solid ${t.cardBorder}` }}>
            <label style={rotulo}>Hora<input value={l.hora} onChange={e => mudaItem('programa', i, { hora: e.target.value })} maxLength={20} placeholder="15h30–15h55" style={c.input} /></label>
            <label style={rotulo}>Tipo<input value={l.tipo} onChange={e => mudaItem('programa', i, { tipo: e.target.value })} maxLength={30} placeholder="Palestra" style={c.input} /></label>
            <label style={rotulo}>Título<input value={l.titulo} onChange={e => mudaItem('programa', i, { titulo: e.target.value })} maxLength={120} style={c.input} /></label>
            <label style={rotulo}>Quem<input value={l.quem} onChange={e => mudaItem('programa', i, { quem: e.target.value })} maxLength={80} style={c.input} /></label>
            <span style={{ display: 'inline-flex', gap: '4px' }}>
              <Botao variante="fantasma" onClick={() => muda('programa', mover(p.programa, i, -1))} disabled={i === 0} aria-label="Subir">↑</Botao>
              <Botao variante="fantasma" onClick={() => muda('programa', mover(p.programa, i, 1))} disabled={i === p.programa.length - 1} aria-label="Descer">↓</Botao>
              <Botao variante="perigo" onClick={() => muda('programa', p.programa.filter((_, j) => j !== i))} aria-label="Retirar linha">×</Botao>
            </span>
          </div>
        ))}
        <div><Botao onClick={() => muda('programa', [...p.programa, { ...NOVA_LINHA }])}>+ Juntar linha</Botao></div>
      </div>

      <h3 style={subtitulo}>Partilha (WhatsApp, redes)</h3>
      {fotoCampo(p.og_imagem, 'og', (url) => muda('og_imagem', url), 'Imagem de partilha (horizontal, 1200×630)')}

      <div style={{ marginTop: '18px', padding: '12px 0 0', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', borderTop: `1px solid ${t.cardBorder}` }}>
        <Botao variante="primario" onClick={guardar} disabled={aGravar || !sujo}>{aGravar ? 'A guardar…' : 'Guardar página'}</Botao>
        {sujo && <span style={{ fontSize: '12px', color: t.textMuted }}>Alterações por guardar.</span>}
        <div style={{ flex: 1 }} />
        <Botao onClick={() => { if (!sujo || window.confirm('Há alterações por guardar. Duplicar a versão guardada?')) aoDuplicar() }}>Duplicar edição</Botao>
      </div>
    </Cartao>
  )
}
