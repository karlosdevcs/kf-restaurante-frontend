import type { Opcao } from '../api/tipos'

// Carrinho do cliente (spec, 9.1): reducer puro, em memoria.
//  - marmita: id unico, tamanho, lista ORDENADA de componentes, quantidade (comeca em 1), preco unitario (o do tamanho).
//    Cada marmita montada e uma linha separada, mesmo que identica a outra.
//  - avulso: agrupado por opcao; a quantidade soma ao adicionar de novo.

export interface ItemMarmita {
  tipo: 'marmita'
  chave: string
  tamanhoId: number
  nomeDoTamanho: string
  componentesIds: number[]
  quantidade: number
  precoUnitario: number
}

export interface ItemAvulso {
  tipo: 'avulso'
  chave: string // `a-{opcaoId}`
  opcaoId: number
  nome: string
  quantidade: number
  precoUnitario: number
}

export type ItemDoCarrinho = ItemMarmita | ItemAvulso

export type AcaoDoCarrinho =
  | { tipo: 'adicionar-marmita'; chave: string; tamanho: { id: number; nome: string; preco: number }; componentesIds: number[] }
  | { tipo: 'adicionar-avulso'; opcao: { id: number; nome: string; preco: number } }
  | { tipo: 'mudar-quantidade'; chave: string; quantidade: number } // 0 (ou menos) remove a linha
  | { tipo: 'limpar' }

export function carrinhoReducer(itens: ItemDoCarrinho[], acao: AcaoDoCarrinho): ItemDoCarrinho[] {
  switch (acao.tipo) {
    case 'adicionar-marmita':
      return [
        ...itens,
        {
          tipo: 'marmita',
          chave: acao.chave,
          tamanhoId: acao.tamanho.id,
          nomeDoTamanho: acao.tamanho.nome,
          componentesIds: [...acao.componentesIds],
          quantidade: 1,
          precoUnitario: acao.tamanho.preco,
        },
      ]

    case 'adicionar-avulso': {
      const chave = chaveDoAvulso(acao.opcao.id)
      if (itens.some((item) => item.chave === chave)) {
        return itens.map((item) => (item.chave === chave ? { ...item, quantidade: item.quantidade + 1 } : item))
      }
      return [...itens, { tipo: 'avulso', chave, opcaoId: acao.opcao.id, nome: acao.opcao.nome, quantidade: 1, precoUnitario: acao.opcao.preco }]
    }

    case 'mudar-quantidade':
      if (acao.quantidade <= 0) return itens.filter((item) => item.chave !== acao.chave)
      return itens.map((item) => (item.chave === acao.chave ? { ...item, quantidade: acao.quantidade } : item))

    case 'limpar':
      return []
  }
}

export const chaveDoAvulso = (opcaoId: number) => `a-${opcaoId}`

export function totalDoCarrinho(itens: readonly ItemDoCarrinho[]): number {
  // centavos inteiros: evita erro de ponto flutuante (0,1 + 0,2)
  const centavos = itens.reduce((soma, item) => soma + Math.round(item.precoUnitario * 100) * item.quantidade, 0)
  return centavos / 100
}

export function quantidadeDeItens(itens: readonly ItemDoCarrinho[]): number {
  return itens.reduce((soma, item) => soma + item.quantidade, 0)
}

export function subtotalDoItem(item: ItemDoCarrinho): number {
  return (Math.round(item.precoUnitario * 100) * item.quantidade) / 100
}

type OpcaoDisponivel = Pick<Opcao, 'id' | 'esgotado'>

// Depois de um recarregamento automatico, uma linha pode conter item que acabou (ou que saiu do cardapio).
export function itemEstaEsgotado(item: ItemDoCarrinho, opcoes: ReadonlyMap<number, OpcaoDisponivel>): boolean {
  const ids = item.tipo === 'marmita' ? item.componentesIds : [item.opcaoId]
  return ids.some((id) => {
    const opcao = opcoes.get(id)
    return !opcao || opcao.esgotado
  })
}

export function nomeDoItem(item: ItemDoCarrinho): string {
  return item.tipo === 'marmita' ? `Marmita ${item.nomeDoTamanho}` : item.nome
}

// "Arroz, Arroz, Feijao": nomes dos componentes de uma marmita, na ordem em que foram marcados (uma linha, com reticencias na tela)
export function detalheDoItem(item: ItemDoCarrinho, opcoes: ReadonlyMap<number, Pick<Opcao, 'nome'>>): string {
  if (item.tipo === 'avulso') return ''
  return item.componentesIds.map((id) => opcoes.get(id)?.nome ?? 'Item indisponível').join(', ')
}
