import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { CarrinhoContext, precoUnitario } from './useCarrinho'
import type { CarrinhoValor, DadosCliente, ItemCarrinho } from './useCarrinho'

const DADOS_INICIAIS: DadosCliente = {
  nome: '',
  telefone: '',
  tipoDeEntrega: 'Retirada',
  endereco: '',
  referencia: '',
  formaDePagamento: 'Pix',
  trocoPara: '',
  observacao: '',
}

let contador = 0
const novaChave = () => `item-${++contador}`

export function CarrinhoProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>([])
  const [dados, setDados] = useState<DadosCliente>(DADOS_INICIAIS)

  const valor = useMemo<CarrinhoValor>(() => {
    const total = itens.reduce((soma, item) => soma + precoUnitario(item) * item.quantidade, 0)
    const quantidadeTotal = itens.reduce((soma, item) => soma + item.quantidade, 0)

    return {
      itens,
      dados,
      total,
      quantidadeTotal,

      // a mesma opcao avulsa clicada de novo soma quantidade, em vez de criar outra linha
      adicionarAvulso: (opcao) =>
        setItens((atuais) => {
          const existente = atuais.find((i) => i.tipo === 'avulso' && i.opcao.id === opcao.id)
          if (existente) {
            return atuais.map((i) => (i.chave === existente.chave ? { ...i, quantidade: i.quantidade + 1 } : i))
          }
          return [...atuais, { chave: novaChave(), tipo: 'avulso', opcao, quantidade: 1 }]
        }),

      adicionarMarmita: (tamanho, componentes) =>
        setItens((atuais) => [...atuais, { chave: novaChave(), tipo: 'marmita', tamanho, componentes, quantidade: 1 }]),

      alterarQuantidade: (chave, quantidade) =>
        setItens((atuais) =>
          quantidade <= 0 ? atuais.filter((i) => i.chave !== chave) : atuais.map((i) => (i.chave === chave ? { ...i, quantidade } : i)),
        ),

      remover: (chave) => setItens((atuais) => atuais.filter((i) => i.chave !== chave)),

      atualizarDados: (parcial) => setDados((atuais) => ({ ...atuais, ...parcial })),

      limpar: () => {
        setItens([])
        setDados(DADOS_INICIAIS)
      },

      itensParaApi: () =>
        itens.map((item) =>
          item.tipo === 'avulso'
            ? { opcaoId: item.opcao.id, quantidade: item.quantidade }
            : { tamanhoId: item.tamanho.id, componentesIds: item.componentes.map((c) => c.id), quantidade: item.quantidade },
        ),
    }
  }, [itens, dados])

  return <CarrinhoContext.Provider value={valor}>{children}</CarrinhoContext.Provider>
}
