import { createContext, useContext } from 'react'
import type { CriarItemDoPedidoRequest, FormaDePagamento, Opcao, TamanhoMarmita, TipoDeEntrega } from '../types/api'

// O carrinho vive so no navegador. Nada vai para o backend ate o "Finalizar pedido".

export type ItemCarrinho =
  | { chave: string; tipo: 'avulso'; opcao: Opcao; quantidade: number }
  | { chave: string; tipo: 'marmita'; tamanho: TamanhoMarmita; componentes: Opcao[]; quantidade: number }

export interface DadosCliente {
  nome: string
  telefone: string
  tipoDeEntrega: TipoDeEntrega
  endereco: string
  referencia: string
  formaDePagamento: FormaDePagamento
  trocoPara: string // texto do input; convertido so no envio
  observacao: string
}

export interface CarrinhoValor {
  itens: ItemCarrinho[]
  dados: DadosCliente
  total: number
  quantidadeTotal: number
  adicionarAvulso: (opcao: Opcao) => void
  adicionarMarmita: (tamanho: TamanhoMarmita, componentes: Opcao[]) => void
  alterarQuantidade: (chave: string, quantidade: number) => void
  remover: (chave: string) => void
  atualizarDados: (parcial: Partial<DadosCliente>) => void
  limpar: () => void
  itensParaApi: () => CriarItemDoPedidoRequest[]
}

export const CarrinhoContext = createContext<CarrinhoValor | null>(null)

export function precoUnitario(item: ItemCarrinho): number {
  return item.tipo === 'avulso' ? (item.opcao.preco ?? 0) : item.tamanho.preco
}

export function useCarrinho(): CarrinhoValor {
  const contexto = useContext(CarrinhoContext)
  if (!contexto) {
    throw new Error('useCarrinho precisa estar dentro de <CarrinhoProvider>')
  }
  return contexto
}
