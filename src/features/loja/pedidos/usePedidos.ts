import { useQuery } from '@tanstack/react-query'
import { buscarPedido, listarPedidos } from '../../../api/pedidos'
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

// Detalhe (itens, endereco, referencia, observacao, troco), buscado sob demanda por pedido. Os itens de um pedido sao
// congelados e so o status muda (e ele vem da lista), entao o cache por id nunca expira: o polling da lista nao refaz detalhes.
export function usePedidoDetalhe(id: number) {
  return useQuery({
    queryKey: ['pedido', id],
    queryFn: ({ signal }) => buscarPedido(id, signal),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
  })
}
