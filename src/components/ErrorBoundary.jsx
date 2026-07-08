import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Log para a consola do browser
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.error) {
      const e = this.state.error
      return (
        <div style={{ minHeight: '100vh', background: '#f5f1e8', color: '#0a2f1a', fontFamily: 'system-ui, sans-serif', padding: '40px', boxSizing: 'border-box' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '20px', margin: '0 0 8px' }}>Ocorreu um erro na aplicação</h1>
            <p style={{ color: '#8a7f66', fontSize: '13px', margin: '0 0 16px' }}>Detalhe técnico (para diagnóstico):</p>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#fff', border: '1px solid #e7decd', borderRadius: '10px', padding: '16px', fontSize: '12px', color: '#c0392b' }}>
              {String(e && e.message ? e.message : e)}
              {'\n\n'}
              {e && e.stack ? e.stack : ''}
            </pre>
            <button onClick={() => { try { localStorage.removeItem('lc-office-theme') } catch { /* noop */ } location.reload() }} style={{ marginTop: '16px', padding: '10px 18px', background: '#0a2f1a', color: '#f3ecdb', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
              Recarregar
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
