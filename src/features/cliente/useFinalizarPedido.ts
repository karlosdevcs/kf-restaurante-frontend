import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { criarPedido } from '../../api/pedidos'
import { totalDoCarrinho } from '../../lib/carrinho'
import { montarPayloadDoPedido, primeiraPendencia } from '../../lib/pedidoCliente'
import { useCliente } from './useCliente'
import type { DadosDoCliente } from './useDadosDoCliente'

// Finalizar pedido (spec, 12.5), igual no celular (tela 3) e no computador (carrinho lateral).
// Valida no cliente, faz POST /pedidos e vai para a confirmacao. Erro de dominio (400) fica visivel acima do botao,
// carrinho e formulario continuam preenchidos, e restaurante e cardapio sao reconsultados.
export function useFinalizarPedido(dados: Pick<DadosDoCliente, 'cardapioId' | 'podePedir' | 'opcoesPorId'>) {
  const { itens, formulario, confirmarPedido } = useCliente()
  const queryClient = useQueryClient()
  const navegar = useNavigate()

  const pendenciaDoFormulario = primeiraPendencia(itens, formulario)
  const total = totalDoCarrinho(itens)

  const envio = useMutation({
    mutationFn: () => {
      if (dados.cardapioId === null) throw new Error('Sem cardápio de hoje.')
      return criarPedido(montarPayloadDoPedido(dados.cardapioId, itens, formulario))
    },
    onSuccess: (pedido) => {
      confirmarPedido(pedido)
      navegar(`/confirmacao/${pedido.numero}`, { replace: true })
    },
    onError: () => {
      // a causa mais comum e loja fechada, cardapio encerrado ou item esgotado
      void queryClient.invalidateQueries({ queryKey: ['restaurante'] })
      void queryClient.invalidateQueries({ queryKey: ['cardapio', 'hoje'] })
    },
  })

  const temItemEsgotado = itens.some((item) => {
    const ids = item.tipo === 'marmita' ? item.componentesIds : [item.opcaoId]
    return ids.some((id) => {
      const opcao = dados.opcoesPorId.get(id)
      return !opcao || opcao.esgotado
    })
  })

  return {
    total,
    /** mensagem acima do botao: a primeira pendencia, ou a do item que acabou */
    pendencia: pendenciaDoFormulario ?? (temItemEsgotado ? 'Remova os itens que acabaram' : null),
    podeFinalizar: dados.podePedir && pendenciaDoFormulario === null && !temItemEsgotado,
    finalizar: () => envio.mutate(),
    enviando: envio.isPending,
    erro: envio.isError ? envio.error.message : null,
  }
}
