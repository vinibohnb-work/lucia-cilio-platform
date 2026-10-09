import { useState, useEffect } from 'react'
import { supabase } from './supabase'

// O que a equipa pediu ao cliente para um mês (documentos_cliente, via a ficha
// da Gestão ligada à conta dele). Lê-se com a sessão do cliente — migração 039.
// Sem ficha ligada, ou antes da 039, devolve a lista vazia e a página segue.

export const ESTADO_PEDIDO = {
  em_falta:   { pt: 'Em falta',   de: 'Fehlt',          en: 'Missing' },
  recebido:   { pt: 'Recebido',   de: 'Eingegangen',    en: 'Received' },
  em_analise: { pt: 'Em análise', de: 'In Prüfung',     en: 'Under review' },
  validado:   { pt: 'Validado',   de: 'Geprüft',        en: 'Validated' },
}

export function usePedidosDocumentos(userId, ano, mes) {
  const [pedidos, setPedidos] = useState([])
  const [carregado, setCarregado] = useState(false)

  useEffect(() => {
    let ativo = true
    if (!userId) { setPedidos([]); setCarregado(true); return }
    setCarregado(false)
    ;(async () => {
      const { data: fichas } = await supabase.from('clientes').select('id').eq('user_id', userId).limit(1)
      const fichaId = fichas?.[0]?.id
      let lista = []
      if (fichaId) {
        const { data } = await supabase.from('documentos_cliente').select('id, tipo, estado, nome, data')
          .eq('cliente_id', fichaId).eq('ano', ano).eq('mes', mes).order('tipo')
        lista = data || []
      }
      if (ativo) { setPedidos(lista); setCarregado(true) }
    })()
    return () => { ativo = false }
  }, [userId, ano, mes])

  return { pedidos, carregado, emFalta: pedidos.filter(p => p.estado === 'em_falta') }
}

// O último relatório trimestral que a equipa marcou como enviado. Lê-se com a
// sessão do cliente — migração 040. Antes dela, ou sem ficha, devolve null.
export function useUltimoRelatorio(userId) {
  const [rel, setRel] = useState(null)
  useEffect(() => {
    let ativo = true
    if (!userId) { setRel(null); return }
    ;(async () => {
      const { data: fichas } = await supabase.from('clientes').select('id').eq('user_id', userId).limit(1)
      const fichaId = fichas?.[0]?.id
      let r = null
      if (fichaId) {
        const { data } = await supabase.from('relatorios_trimestrais').select('ano, trimestre, enviado_em')
          .eq('cliente_id', fichaId).eq('estado', 'enviado')
          .order('ano', { ascending: false }).order('trimestre', { ascending: false }).limit(1)
        r = data?.[0] || null
      }
      if (ativo) setRel(r)
    })()
    return () => { ativo = false }
  }, [userId])
  return rel
}
