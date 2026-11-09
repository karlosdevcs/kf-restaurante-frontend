import { useQuery } from '@tanstack/react-query'
import { listarPedidos } from '../../../api/pedidos'
import type { PedidoResumo } from '../../../api/tipos'

export const CHAVE_DOS_PEDIDOS_DE_HOJE = ['pedidos', 'hoje'] as const

const INTERVALO_DA_LISTA = 30_000

// mais recente primeiro; a API ja devolve assim, mas a tela nao depende da ordem de la
function maisRecentePrimeiro(a: PedidoResumo, b: PedidoResumo): number {
  return b.horaPedido.localeCompare(a.horaPedido) || b.numero - a.numero
}

// Lista de pedidos de hoje (resumos). Polling a cada 30 s com a aba visivel (o TanStack Query pausa em segundo plano)
// e ao voltar o foco para a janela. A contagem dos filtros vem sempre da lista completa: nao envia `status` a API.
export function usePedidosDeHoje() {
  return useQuery({
    queryKey: CHAVE_DOS_PEDIDOS_DE_HOJE,
    queryFn: async ({ signal }) => (await listarPedidos({}, signal)).toSorted(maisRecentePrimeiro),
    refetchInterval: INTERVALO_DA_LISTA,
    refetchOnWindowFocus: true,
    staleTime: 0,
  })
}
