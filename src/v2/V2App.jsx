import { useState } from 'react'
import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useIsMobile } from '../hooks/useIsMobile'
import { useAuth } from '../context/AuthContext'
import { homePathFor } from '../lib/platformHome'
import { useV2, repor } from './dados'
import { PerfilContext, Ic } from './ui'
import { naoLidas, tarefaAtrasada, lembreteAtivo, clientePorId } from './seletores'
import { fmtData } from './regras'
import ListaClientes from './paginas/ListaClientes'
import PaginaCliente from './paginas/PaginaCliente'
import Agenda from './paginas/Agenda'
import Tarefas from './paginas/Tarefas'
import Relatorios from './paginas/Relatorios'
import Mensagens from './paginas/Mensagens'

// v2 · Portal de gestão de clientes (documento da Lúcia e da Letícia, 22/09).
//
// Vive em /v2, ao lado da plataforma atual e sem lhe tocar, para as duas se
// poderem comparar. O menu é o do mockup delas: Clientes · Agenda · Tarefas ·
// Relatórios · Mensagens. Em baixo, o seletor de perfis (secção 10 do
// documento) mostra a mesma plataforma como Administradora, Colaboradora ou
// Cliente.

export default function V2App() {
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const s = useV2()
  const navigate = useNavigate()
  const { role, platform } = useAuth()
  // Quem não é administradora entra como Colaboradora (o perfil da Letícia no documento).
  const perfilInicial = { papel: role === 'admin' ? 'admin' : 'colaboradora', clienteId: 'vania' }
  const [perfil, setPerfil] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('lc-v2-perfil')) || perfilInicial } catch { return perfilInicial }
  })
  const [sino, setSino] = useState(false)
  const mudarPerfil = (p) => {
    setPerfil(p)
    try { sessionStorage.setItem('lc-v2-perfil', JSON.stringify(p)) } catch { /* sem armazenamento */ }
    navigate(p.papel === 'cliente' ? '/v2/portal' : '/v2/clientes')
  }

  const eCliente = perfil.papel === 'cliente'
  const lembretes = eCliente ? [] : s.tarefas.filter(x => lembreteAtivo(x)).sort((a, b) => a.prazo.localeCompare(b.prazo))
  const nav = eCliente
    ? [['/v2/portal', 'A minha empresa', Ic.clientes]]
    : [
      ['/v2/clientes', 'Clientes', Ic.clientes],
      ['/v2/agenda', 'Agenda', Ic.agenda],
      ['/v2/tarefas', 'Tarefas', Ic.tarefas, s.tarefas.filter(x => tarefaAtrasada(x)).length],
      ['/v2/relatorios', 'Relatórios', Ic.relatorios],
      ['/v2/mensagens', 'Mensagens', Ic.mensagens, naoLidas(s).length],
    ]

  const papeis = [['admin', 'Administradora'], ['colaboradora', 'Colaboradora'], ['cliente', 'Cliente']]

  const barraLateral = (
    <aside style={{
      background: t.sidebarBg, color: '#f3ecdb', display: 'flex', flexDirection: isMobile ? 'row' : 'column',
      ...(isMobile
        ? { position: 'sticky', top: 0, zIndex: 60, alignItems: 'center', gap: '6px', padding: 'calc(env(safe-area-inset-top) + 8px) 10px 8px', overflowX: 'auto' }
        : { position: 'fixed', top: 0, left: 0, bottom: 0, width: '236px', padding: '26px 0 18px' }),
    }}>
      {!isMobile && (
        <div style={{ padding: '0 22px 22px', textAlign: 'center', borderBottom: `1px solid ${t.sidebarBorder}`, marginBottom: '18px' }}>
          <img src="/icons/icon-192.png" alt="" style={{ width: '58px', height: '58px', borderRadius: '14px' }} />
          <div style={{ fontFamily: t.fontDisplay, fontStyle: 'italic', fontSize: '19px', lineHeight: 1, marginTop: '10px' }}>Lúcia Cílio</div>
          <div style={{ fontSize: '10px', letterSpacing: '2.4px', textTransform: 'uppercase', marginTop: '4px', color: t.sidebarSub }}>Office Consulting</div>
          <div style={{ fontSize: '8.5px', letterSpacing: '1.4px', textTransform: 'uppercase', marginTop: '8px', color: '#c9a84c', lineHeight: 1.5 }}>Mais do que contabilidade<br />para o seu futuro</div>
        </div>
      )}
      <nav style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: isMobile ? '4px' : '3px', padding: isMobile ? 0 : '0 12px', flex: isMobile ? 'none' : 1 }}>
        {nav.map(([to, rot, Icone, badge]) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '12px', padding: isMobile ? '8px 12px' : '12px 14px', borderRadius: '10px',
            textDecoration: 'none', fontSize: isMobile ? '12.5px' : '14.5px', fontWeight: isActive ? 700 : 500, whiteSpace: 'nowrap',
            background: isActive ? 'rgba(201,168,76,.16)' : 'transparent', color: isActive ? '#f3ecdb' : '#b9c8be',
          })}>
            <Icone size={isMobile ? 16 : 19} />{rot}
            {!!badge && <span style={{ marginLeft: 'auto', fontSize: '10.5px', fontWeight: 800, padding: '1px 7px', borderRadius: '20px', background: '#c0392b', color: '#fff' }}>{badge}</span>}
          </NavLink>
        ))}
      </nav>
      {!isMobile && (
        <div style={{ padding: '14px 18px 0', borderTop: `1px solid ${t.sidebarBorder}` }}>
          <div style={{ fontSize: '10px', letterSpacing: '1.6px', textTransform: 'uppercase', color: t.sidebarSub, marginBottom: '7px' }}>Ver como</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {papeis.map(([k, r]) => (
              <button key={k} onClick={() => mudarPerfil({ ...perfil, papel: k })} style={{
                textAlign: 'left', padding: '7px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                border: `1px solid ${perfil.papel === k ? '#c9a84c' : t.sidebarBorder}`, background: perfil.papel === k ? 'rgba(201,168,76,.18)' : 'transparent', color: perfil.papel === k ? '#f3ecdb' : t.sidebarSub,
              }}>{r}</button>
            ))}
          </div>
          {eCliente && (
            <select value={perfil.clienteId} onChange={e => mudarPerfil({ ...perfil, clienteId: e.target.value })}
              style={{ marginTop: '8px', width: '100%', padding: '7px 8px', borderRadius: '8px', background: 'rgba(255,255,255,.06)', color: '#f3ecdb', border: `1px solid ${t.sidebarBorder}`, fontSize: '12px', fontFamily: 'inherit' }}>
              {s.clientes.map(c => <option key={c.id} value={c.id} style={{ color: '#000' }}>{c.nome}</option>)}
            </select>
          )}
          <div style={{ fontFamily: t.fontDisplay, fontStyle: 'italic', fontSize: '17px', lineHeight: 1.3, color: '#e9dfc4', marginTop: '18px' }}>Empresas hoje.<br />Mais futuro amanhã.</div>
        </div>
      )}
      {isMobile && (
        <select value={perfil.papel} onChange={e => mudarPerfil({ ...perfil, papel: e.target.value })} aria-label="Ver como"
          style={{ marginLeft: 'auto', flex: 'none', padding: '6px', borderRadius: '8px', background: 'transparent', color: '#f3ecdb', border: `1px solid ${t.sidebarBorder}`, fontSize: '12px' }}>
          {papeis.map(([k, r]) => <option key={k} value={k} style={{ color: '#000' }}>{r}</option>)}
        </select>
      )}
    </aside>
  )

  return (
    <PerfilContext.Provider value={perfil}>
      <div style={{ minHeight: '100vh', background: t.appBg, fontFamily: t.fontBody, color: t.text }}>
        {barraLateral}
        <div style={{ marginLeft: isMobile ? 0 : '236px' }}>
          {/* Faixa da pré-visualização: o que isto é e como voltar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', padding: '8px 22px', background: '#0f3b22', color: '#e9dfc4', fontSize: '12px' }}>
            <span style={{ fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: '#c9a84c', color: '#0a2f1a', letterSpacing: '.5px' }}>v2</span>
            <span>Pré-visualização do portal de gestão de clientes — dados de demonstração, guardados só neste browser.</span>
            <span style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
              {!eCliente && (
                <span style={{ position: 'relative' }}>
                  <button onClick={() => setSino(v => !v)} aria-label="Lembretes" style={{ background: 'none', border: 'none', color: '#e9dfc4', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700, fontFamily: 'inherit' }}>
                    <Ic.sino size={16} />{lembretes.length}
                  </button>
                  {sino && (
                    <div style={{ position: 'absolute', right: 0, top: '26px', width: '320px', maxWidth: '85vw', background: t.cardBg, color: t.text, border: `1px solid ${t.cardBorder}`, borderRadius: '12px', boxShadow: '0 20px 40px -12px rgba(0,0,0,.3)', zIndex: 100, padding: '12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.6px', color: t.textMuted, marginBottom: '8px' }}>Lembretes automáticos</div>
                      {lembretes.length === 0 && <div style={{ fontSize: '12.5px', color: t.subtle }}>Nada a lembrar hoje.</div>}
                      {lembretes.slice(0, 8).map(x => (
                        <button key={x.id} onClick={() => { setSino(false); navigate(x.clienteId ? `/v2/clientes/${x.clienteId}/tarefas` : '/v2/tarefas') }}
                          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 8px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
                          <div style={{ fontSize: '12.5px', fontWeight: 700, color: t.heading }}>{x.titulo}</div>
                          <div style={{ fontSize: '11.5px', color: tarefaAtrasada(x) ? t.neg : t.subtle }}>{x.clienteId ? clientePorId(s, x.clienteId)?.nome + ' · ' : ''}{tarefaAtrasada(x) ? 'em atraso desde ' : 'até '}{fmtData(x.prazo)}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </span>
              )}
              <button onClick={() => { if (window.confirm('Repor os dados de demonstração? As alterações feitas na v2 perdem-se.')) repor() }} style={{ background: 'none', border: 'none', color: '#e9dfc4', cursor: 'pointer', textDecoration: 'underline', fontSize: '12px', fontFamily: 'inherit' }}>Repor dados</button>
              <a href={homePathFor(role, platform)} style={{ color: '#c9a84c', fontWeight: 700, textDecoration: 'none' }}>← Plataforma atual</a>
            </span>
          </div>
          <main style={{ padding: isMobile ? '18px 14px 40px' : '28px 32px 48px', maxWidth: '1360px' }}>
            <Routes>
              {eCliente ? (
                <>
                  <Route path="portal/:sep?" element={<PaginaCliente idFixo={perfil.clienteId} />} />
                  <Route path="*" element={<Navigate to="/v2/portal" replace />} />
                </>
              ) : (
                <>
                  <Route index element={<Navigate to="clientes" replace />} />
                  <Route path="clientes" element={<ListaClientes />} />
                  <Route path="clientes/:id/:sep?" element={<PaginaCliente />} />
                  <Route path="agenda" element={<Agenda />} />
                  <Route path="tarefas" element={<Tarefas />} />
                  <Route path="relatorios" element={<Relatorios />} />
                  <Route path="mensagens" element={<Mensagens />} />
                  <Route path="*" element={<Navigate to="/v2/clientes" replace />} />
                </>
              )}
            </Routes>
          </main>
        </div>
      </div>
    </PerfilContext.Provider>
  )
}
