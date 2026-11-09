import { createContext } from 'react'
import type { Pedido } from '../../api/tipos'
import type { ItemDoCarrinho } from '../../lib/carrinho'
import type { FormularioDoPedido } from '../../lib/pedidoCliente'

export interface ValorDoCliente {
  itens: ItemDoCarrinho[]
  /** `quantidade` comeca em 1; no computador o stepper do produto pode pedir mais */
  adicionarMarmita: (tamanho: { id: number; nome: string; preco: number }, componentesIds: number[], quantidade?: number) => void
  adicionarAvulso: (opcao: { id: number; nome: string; preco: number }) => void
  /** 0 remove a linha */
  mudarQuantidade: (chave: string, quantidade: number) => void

  formulario: FormularioDoPedido
  atualizarFormulario: (parcial: Partial<FormularioDoPedido>) => void

  /** resposta do POST /pedidos, para a tela de confirmacao */
  pedidoConfirmado: Pedido | null
  confirmarPedido: (pedido: Pedido) => void
  /** "Fazer outro pedido": limpa carrinho e confirmacao */
  recomecar: () => void
}

export const ClienteContext = createContext<ValorDoCliente | null>(null)
