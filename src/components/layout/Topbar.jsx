import { useLocation, useNavigate } from 'react-router-dom'

const titles = {
  '/dashboard':                   'Dashboard',
  '/esg/projetos':                'Projetos ESG',
  '/esg/diagnostico':             'Diagnóstico ESG',
  '/esg/materialidade':           'Dupla Materialidade',
  '/esg/kpis':                    'KPIs & Monitorização',
  '/esg/relatorios':              'Relatórios ESG',
  '/contabilidade/clientes':      'Clientes',
  '/contabilidade/obrigacoes':    'Obrigações Fiscais',
  '/contabilidade/tarefas':       'Tarefas',
  '/financeiro':                  'Financeiro',
}

export default function Topbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const title = titles[pathname] || 'Office Consulting'

  return (
    <div style={{
      background: '#fff', padding: '0 30px', height: '62px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: '1px solid #dde8de', position: 'sticky', top: 0, zIndex: 50,
      boxShadow: '0 2px 8px rgba(0,0,0,.04)',
    }}>
      <h1 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--green)', margin: 0 }}>{title}</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <span style={{ fontSize: '12px', color: '#64748b' }}>📅 6 de maio de 2026</span>
        <div style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid #dde8de', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '17px', background: '#fff', position: 'relative' }}>
          🔔
          <span style={{ position: 'absolute', top: '6px', right: '6px', width: '7px', height: '7px', background: '#e53e3e', borderRadius: '50%', border: '2px solid #fff' }}></span>
        </div>
        <button
          onClick={() => navigate('/esg/diagnostico')}
          style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: 'none', background: 'var(--gold)', color: 'var(--green)' }}
        >
          + Novo Diagnóstico
        </button>
      </div>
    </div>
  )
}
