import { useNavigate } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { t } from '../i18n/translations'

const G = '#0d3b20'
const GM = '#1a5c32'
const GOLD = '#c9a84c'
const BG = '#f2f6f3'

const Logo = () => (
  <svg width="40" height="40" viewBox="0 0 50 50" fill="none">
    <circle cx="25" cy="25" r="25" fill="#0a3318"/>
    <path d="M37 13 A15 15 0 1 0 37 37" stroke="#c9a84c" strokeWidth="3.2" strokeLinecap="round" fill="none"/>
    <path d="M32 18 A9 9 0 1 0 32 32" stroke="#c9a84c" strokeWidth="2.3" strokeLinecap="round" fill="none"/>
    <line x1="18" y1="15" x2="18" y2="31" stroke="#c9a84c" strokeWidth="2.8" strokeLinecap="round"/>
    <line x1="18" y1="31" x2="26" y2="31" stroke="#c9a84c" strokeWidth="2.8" strokeLinecap="round"/>
  </svg>
)

export default function Landing() {
  const navigate = useNavigate()
  const { lang, setLang } = useLang()

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", color: G, background: '#fff' }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #e8f0ea',
        padding: '0 6%', height: '68px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Logo />
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '16px', fontWeight: 600, fontStyle: 'italic', color: G, letterSpacing: '0.5px', lineHeight: 1.1 }}>Lúcia Cílio</div>
            <div style={{ fontWeight: 800, fontSize: '11px', color: GOLD, letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: '2px' }}>Office Consulting</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <a href="#como-funciona" style={{ fontSize: '13px', fontWeight: 600, color: G, textDecoration: 'none', opacity: .75 }}>{t(lang,'land_nav_how')}</a>
          <a href="#sobre" style={{ fontSize: '13px', fontWeight: 600, color: G, textDecoration: 'none', opacity: .75 }}>{t(lang,'land_nav_about')}</a>
          <a href="#contacto" style={{ fontSize: '13px', fontWeight: 600, color: G, textDecoration: 'none', opacity: .75 }}>{t(lang,'land_nav_contact')}</a>
          {/* Language toggle */}
          <div style={{ display: 'flex', gap: '4px', background: BG, borderRadius: '8px', padding: '3px', border: '1px solid #dde8de' }}>
            {[['pt','🇵🇹'],['de','🇩🇪']].map(([code, flag]) => (
              <button key={code} onClick={() => setLang(code)} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer', background: lang === code ? G : 'transparent', color: lang === code ? '#fff' : '#64748b' }}>
                {flag} {code.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate('/diagnostico-gratuito')}
            style={{ padding: '9px 20px', background: G, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
          >
            {t(lang,'land_nav_cta')}
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        background: `linear-gradient(135deg, ${G} 0%, #1a5c32 60%, #1e6b38 100%)`,
        padding: '90px 6% 80px 11%',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '560px',
      }}>
        {/* Foto lado direito — container full-width para gradiente sem aresta */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          pointerEvents: 'none',
        }}>
          <img
            src="/foto LP.jpg"
            alt=""
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: '62%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 30%',
              transform: 'scale(1.26)',
              transformOrigin: 'center 30%',
              opacity: 0.32,
            }}
          />
          {/* gradiente sobre toda a secção — transição larga sem aresta */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(to right,
              #0d3b20 0%,
              #0d3b20 30%,
              rgba(13,59,32,0.97) 36%,
              rgba(13,59,32,0.91) 42%,
              rgba(13,59,32,0.78) 49%,
              rgba(13,59,32,0.58) 57%,
              rgba(13,59,32,0.34) 66%,
              rgba(13,59,32,0.12) 75%,
              transparent 85%
            )`,
          }} />
          {/* escurecimento topo e fundo */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(to bottom, rgba(13,59,32,0.5) 0%, transparent 18%, transparent 80%, rgba(13,59,32,0.55) 100%)`,
          }} />
        </div>

        {/* Conteúdo à esquerda */}
        <div style={{ position: 'relative', maxWidth: '560px' }}>
          <div style={{ display: 'inline-block', background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.4)', color: GOLD, fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', padding: '5px 16px', borderRadius: '20px', marginBottom: '32px' }}>
            {t(lang,'land_hero_badge')}
          </div>

          <h1 style={{ fontSize: 'clamp(38px, 5vw, 64px)', fontWeight: 900, color: '#fff', margin: '0 0 22px', lineHeight: 1.08, letterSpacing: '-1px' }}>
            {t(lang,'land_hero_h1a')}<br />
            <span style={{ color: GOLD }}>{t(lang,'land_hero_h1b')}</span>
          </h1>

          <p style={{ fontSize: 'clamp(16px, 1.8vw, 19px)', color: 'rgba(255,255,255,.8)', maxWidth: '460px', margin: '0 0 40px', lineHeight: 1.65 }}>
            {t(lang,'land_hero_sub')}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '380px' }}>
            <button
              onClick={() => navigate('/diagnostico-gratuito')}
              style={{ width: '100%', padding: '17px 32px', background: GOLD, color: G, border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(201,168,76,.4)' }}
            >
              {t(lang,'land_hero_cta')}
            </button>
            <a href="#como-funciona" style={{ width: '100%', padding: '17px 32px', background: 'rgba(255,255,255,.1)', color: '#fff', border: '1px solid rgba(255,255,255,.25)', borderRadius: '10px', fontWeight: 600, fontSize: '15px', cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
              {t(lang,'land_hero_learn')}
            </a>
          </div>
        </div>
      </section>

      {/* ── PROBLEMA ── */}
      <section style={{ padding: '80px 6%', background: BG }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <div style={chip}>O Desafio</div>
            <h2 style={h2}>A maioria das empresas não<br />falha por falta de vendas</h2>
            <p style={subtext}>Falha por falta de estrutura, visão e adaptação às novas exigências do mercado.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {[
              { n: '01', title: 'Estrutura', desc: 'Sem números, processos e prioridades, a empresa não sabe onde está nem para onde vai.', icon: '🏗️' },
              { n: '02', title: 'Visão', desc: 'Sem visão, o negócio fica preso ao curto prazo e perde oportunidades estratégicas.', icon: '🔭' },
              { n: '03', title: 'Adaptação', desc: 'Sem adaptação às exigências ESG de bancos, clientes e investidores, a empresa fica para trás.', icon: '🔄' },
            ].map(c => (
              <div key={c.n} style={{ background: '#fff', borderRadius: '14px', padding: '28px', border: '1px solid #dde8de', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>{c.icon}</div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: GOLD, letterSpacing: '2px', marginBottom: '6px' }}>{c.n}</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: G, marginBottom: '10px' }}>{c.title}</div>
                <p style={{ fontSize: '14px', color: '#4a6355', lineHeight: 1.6 }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRESSÃO / URGÊNCIA 2026 ── */}
      <section style={{ padding: '80px 6%', background: '#fff' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
            <div>
              <div style={chip}>Urgência</div>
              <h2 style={{ ...h2, textAlign: 'left', marginBottom: '16px' }}>
                O mercado já não exige<br />apenas resultados.
              </h2>
              <p style={{ fontSize: '16px', color: '#4a6355', lineHeight: 1.7, marginBottom: '28px' }}>
                Exige <strong>responsabilidade</strong>. A partir de 2026, os relatórios de sustentabilidade tornaram-se obrigatórios. As empresas que não se adaptarem vão perder acesso a financiamento, clientes e talento.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['Bancos condicionam crédito a critérios ESG', 'Clientes preferem fornecedores sustentáveis', 'Investidores exigem transparência ESG', 'Colaboradores escolhem empresas com propósito'].map(t => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: G, fontWeight: 500 }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#d1fae5', color: GM, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, flexShrink: 0 }}>✓</span>
                    {t}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { year: '2004', text: 'ESG surge — relatório ONU "Who Cares Wins"' },
                { year: '2015', text: 'Agenda 2030 e Acordo de Paris' },
                { year: '2023', text: 'ESG no Fórum Económico Mundial' },
                { year: '2026', text: 'Relatórios de sustentabilidade obrigatórios', highlight: true },
              ].map(e => (
                <div key={e.year} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 18px', borderRadius: '10px', background: e.highlight ? G : BG, border: e.highlight ? 'none' : '1px solid #dde8de' }}>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: e.highlight ? GOLD : G, minWidth: '48px' }}>{e.year}</div>
                  <div style={{ fontSize: '13px', color: e.highlight ? 'rgba(255,255,255,.9)' : '#4a6355', fontWeight: e.highlight ? 700 : 400 }}>{e.text}</div>
                  {e.highlight && <span style={{ marginLeft: 'auto', fontSize: '10px', background: GOLD, color: G, padding: '2px 8px', borderRadius: '10px', fontWeight: 800, whiteSpace: 'nowrap' }}>AGORA</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── O QUE GANHA ── */}
      <section style={{ padding: '80px 6%', background: G }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.3)', color: GOLD, fontSize: '11px', fontWeight: 700, letterSpacing: '2px', padding: '5px 16px', borderRadius: '20px', marginBottom: '20px', textTransform: 'uppercase' }}>Benefícios</div>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 900, color: '#fff', marginBottom: '48px' }}>O que a sua empresa ganha com ESG</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            {[
              { icon: '💰', title: 'Redução de Custos', desc: 'Eficiência nos recursos traduz-se em poupança real em energia, resíduos e operações.' },
              { icon: '🏦', title: 'Melhor Financiamento', desc: 'Empresas com práticas ESG acedem a capital com condições mais favoráveis e taxas mais baixas.' },
              { icon: '🛡️', title: 'Gestão de Risco', desc: 'Evita multas, crises reputacionais e custos associados a não conformidade.' },
              { icon: '🚀', title: 'Competitividade', desc: 'Diferencia a empresa no mercado e abre portas a clientes e mercados exigentes.' },
            ].map(b => (
              <div key={b.title} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '14px', padding: '28px 22px', textAlign: 'left' }}>
                <div style={{ fontSize: '36px', marginBottom: '14px' }}>{b.icon}</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: GOLD, marginBottom: '8px' }}>{b.title}</div>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.7)', lineHeight: 1.6 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section id="como-funciona" style={{ padding: '80px 6%', background: '#fff' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <div style={chip}>Metodologia</div>
          <h2 style={h2}>Como aplicamos ESG na prática</h2>
          <p style={{ ...subtext, marginBottom: '52px' }}>Uma abordagem estruturada em 4 etapas, do diagnóstico ao relatório.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0', position: 'relative' }}>
            {[
              { n: '01', icon: '🔍', title: 'Diagnóstico', sub: 'Onde estamos?', desc: 'Avaliamos a posição da empresa nos pilares E, S e G através de uma sessão estruturada.' },
              { n: '02', icon: '⚖️', title: 'Prioridades', sub: 'O que é relevante?', desc: 'Matriz de dupla materialidade: o que impacta o ambiente e o que impacta o negócio.' },
              { n: '03', icon: '📈', title: 'Métricas', sub: 'Como acompanhar?', desc: 'Definimos KPIs específicos para monitorizar o progresso ao longo do tempo.' },
              { n: '04', icon: '📋', title: 'Relatório', sub: 'Como comunicar?', desc: 'Relatório de sustentabilidade visual, partilhado com bancos, clientes e investidores.' },
            ].map((s, i) => (
              <div key={s.n} style={{ padding: '32px 24px', borderRight: i < 3 ? '1px solid #e8f0ea' : 'none', position: 'relative' }}>
                {i < 3 && (
                  <div style={{ position: 'absolute', top: '36px', right: '-10px', zIndex: 1, fontSize: '16px', color: GOLD }}>→</div>
                )}
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: G, color: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', margin: '0 auto 16px', boxShadow: `0 4px 16px rgba(13,59,32,.2)` }}>
                  {s.icon}
                </div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: GOLD, letterSpacing: '2px', marginBottom: '6px' }}>PASSO {s.n}</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: G, marginBottom: '4px' }}>{s.title}</div>
                <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#64748b', marginBottom: '12px' }}>{s.sub}</div>
                <p style={{ fontSize: '13px', color: '#4a6355', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA DIAGNÓSTICO ── */}
      <section style={{ padding: '80px 6%', background: BG }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '52px 48px', border: `2px solid ${GOLD}`, boxShadow: '0 8px 40px rgba(13,59,32,.08)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌱</div>
            <h2 style={{ fontSize: '28px', fontWeight: 900, color: G, marginBottom: '14px', letterSpacing: '-0.5px' }}>
              Descubra onde a sua empresa<br />está em ESG — gratuitamente
            </h2>
            <p style={{ fontSize: '15px', color: '#4a6355', lineHeight: 1.7, marginBottom: '32px' }}>
              Responda a 9 perguntas rápidas e receba um diagnóstico ESG inicial com score nos pilares Ambiental, Social e Governança. Sem compromisso.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
              {['⏱️ 5 minutos', '📊 Score imediato', '📧 Relatório por email', '🔒 100% gratuito'].map(t => (
                <span key={t} style={{ background: BG, border: '1px solid #dde8de', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: G }}>{t}</span>
              ))}
            </div>
            <button
              onClick={() => navigate('/diagnostico-gratuito')}
              style={{ padding: '16px 48px', background: G, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '16px', cursor: 'pointer', boxShadow: `0 4px 20px rgba(13,59,32,.3)` }}
            >
              Iniciar Diagnóstico →
            </button>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '14px' }}>
              Já responderam 47 empresas este mês
            </p>
          </div>
        </div>
      </section>

      {/* ── SOBRE ── */}
      <section id="sobre" style={{ padding: '80px 6%', background: '#fff' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
          <div>
            <div style={chip}>Sobre</div>
            <h2 style={{ ...h2, textAlign: 'left', fontSize: '32px', marginBottom: '16px', fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontWeight: 600 }}>Lúcia Cílio</h2>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {['TOC Certificada', 'Consultora ESG', 'Portugal · Alemanha'].map(t => (
                <span key={t} style={{ background: BG, border: '1px solid #dde8de', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, color: G }}>{t}</span>
              ))}
            </div>
            <p style={{ fontSize: '14px', color: '#4a6355', lineHeight: 1.8, marginBottom: '16px' }}>
              Contabilista certificada e consultora ESG com presença em Portugal e na Alemanha. Especializada em ajudar PMEs a estruturar a sua estratégia de sustentabilidade — com foco em resultados concretos.
            </p>
            <p style={{ fontSize: '14px', color: '#4a6355', lineHeight: 1.8, marginBottom: '28px' }}>
              Acredita que <strong style={{ color: G }}>"as empresas que vão durar não são as maiores — são as que conseguem adaptar-se"</strong>.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {[
                { val: '47+', label: 'Clientes ativos' },
                { val: '10+', label: 'Anos de experiência' },
                { val: '2', label: 'Países de atuação' },
                { val: '€50k', label: 'Projetos ESG até' },
              ].map(s => (
                <div key={s.val} style={{ background: BG, borderRadius: '10px', padding: '16px', border: '1px solid #dde8de' }}>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: G }}>{s.val}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { icon: '📋', title: 'Diagnóstico ESG', desc: 'Sessão estruturada para avaliar a posição da empresa nos três pilares.' },
              { icon: '⚖️', title: 'Dupla Materialidade', desc: 'Identificação dos temas mais relevantes para o negócio e para os stakeholders.' },
              { icon: '📈', title: 'KPIs & Monitorização', desc: 'Definição e acompanhamento de indicadores-chave de desempenho ESG.' },
              { icon: '📊', title: 'Relatório de Sustentabilidade', desc: 'Documento visual para apresentar a bancos, clientes e investidores.' },
            ].map(s => (
              <div key={s.title} style={{ display: 'flex', gap: '14px', padding: '16px', background: BG, borderRadius: '12px', border: '1px solid #dde8de' }}>
                <span style={{ fontSize: '24px', flexShrink: 0 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: G, marginBottom: '3px' }}>{s.title}</div>
                  <div style={{ fontSize: '12px', color: '#4a6355' }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer id="contacto" style={{ background: G, padding: '48px 6%' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Logo />
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '17px', fontWeight: 600, fontStyle: 'italic', color: '#fff', letterSpacing: '0.5px', lineHeight: 1.1 }}>Lúcia Cílio</div>
              <div style={{ fontWeight: 800, fontSize: '10px', color: GOLD, letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: '2px' }}>Office Consulting</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            <a href="#como-funciona" style={{ color: 'rgba(255,255,255,.6)', fontSize: '13px', textDecoration: 'none' }}>Como Funciona</a>
            <a href="#sobre" style={{ color: 'rgba(255,255,255,.6)', fontSize: '13px', textDecoration: 'none' }}>Sobre</a>
            <a href="mailto:lucia@officeconsulting.com" style={{ color: GOLD, fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>lucia@officeconsulting.com</a>
          </div>
          <div style={{ color: 'rgba(255,255,255,.35)', fontSize: '12px' }}>
            © 2026 LC Office Consulting · Portugal & Deutschland
          </div>
        </div>
      </footer>

    </div>
  )
}

// ── shared styles ──
const chip = {
  display: 'inline-block', background: '#d1fae5', color: '#065f46',
  fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase',
  padding: '5px 14px', borderRadius: '20px', marginBottom: '16px',
}
const h2 = {
  fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 900, color: G,
  marginBottom: '14px', letterSpacing: '-0.5px', textAlign: 'center', lineHeight: 1.2,
}
const subtext = {
  fontSize: '16px', color: '#4a6355', textAlign: 'center', lineHeight: 1.7,
  maxWidth: '560px', margin: '0 auto',
}
