import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import EsqueletoPagina from '../components/EsqueletoPagina'
import { usePortal, carregar, limparErro } from './dados'
import { PerfilContext } from './ui'

// Portal de gestão de clientes — Clientes, Agenda, Tarefas, Relatórios e
// Mensagens da Gestão (documento da Lúcia e da Letícia, 22/09).
//
// Nasceu como v2, em /v2, ao lado da plataforma. Passou a ser a Gestão a 29/09:
// vive dentro da plataforma, com o menu de sempre, e lê e grava no Supabase.
// Este ficheiro só carrega os dados e diz às páginas quem está a trabalhar:
// a administradora vê tudo; a restante equipa trabalha tudo menos a avença.
// As páginas continuam a saber mostrar a "área visível" do cliente (modoCliente),
// para quando o portal do cliente for ligado — por agora o cliente usa a v1.

export default function Portal() {
  const { user, role } = useAuth()
  const { t } = useTheme()
  const s = usePortal()
  const admin = role === 'admin'
  const eu = user?.user_metadata?.display_name || user?.email?.split('@')[0] || ''

  useEffect(() => { if (user) carregar({ eu, admin }) }, [user?.id])  // eslint-disable-line react-hooks/exhaustive-deps

  if (!s.carregado) return <EsqueletoPagina cartoes={3} linhas={6} />

  return (
    <PerfilContext.Provider value={{ papel: admin ? 'admin' : 'colaboradora', clienteId: null }}>
      {s.erro && (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', marginBottom: '16px', borderRadius: '10px', background: t.dueLate.bg, color: t.dueLate.ink, fontSize: '13px', fontWeight: 600 }}>
          <span style={{ flex: 1 }}>{s.erro}</span>
          <button onClick={limparErro} aria-label="Fechar" style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '15px' }}>✕</button>
        </div>
      )}
      <Outlet />
    </PerfilContext.Provider>
  )
}
