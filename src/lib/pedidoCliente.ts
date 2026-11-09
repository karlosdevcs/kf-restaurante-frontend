import type { CriarPedidoRequest, FormaDePagamento, ItemDoPedidoRequest, TipoDeEntrega } from '../api/tipos'
import { totalDoCarrinho, type ItemDoCarrinho } from './carrinho'
import { formatBRL, somenteDigitos } from './formatar'

// Formulario do cliente: validacao (12.3) e montagem do payload de POST /pedidos (12.5).

export interface FormularioDoPedido {
  nome: string
  telefone: string // como foi digitado (mascara livre)
  tipoDeEntrega: TipoDeEntrega
  endereco: string
  referencia: string
  formaDePagamento: FormaDePagamento
  troco: string // texto digitado; so vale com Dinheiro
  observacao: string
}

export const FORMULARIO_INICIAL: FormularioDoPedido = {
  nome: '',
  telefone: '',
  tipoDeEntrega: 'Retirada',
  endereco: '',
  referencia: '',
  formaDePagamento: 'Pix',
  troco: '',
  observacao: '',
}

// "100", "100,50", "100.50", "R$ 1.000,50" -> numero; vazio ou ilegivel -> null
export function lerTroco(texto: string): number | null {
  let limpo = texto.replace(/R\$/gi, '').replace(/\s/g, '')
  if (limpo === '') return null

  // "1.000,50": ponto e milhar quando ha virgula; sem virgula, ponto e decimal
  limpo = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo
  if (!/^\d+(\.\d+)?$/.test(limpo)) return Number.NaN

  return Number(limpo)
}

// A PRIMEIRA pendencia encontrada vira a mensagem acima do botao, e o botao fica desabilitado.
export function primeiraPendencia(itens: readonly ItemDoCarrinho[], formulario: FormularioDoPedido): string | null {
  if (itens.length === 0) return 'Adicione pelo menos um item'
  if (formulario.nome.trim() === '') return 'Preencha seu nome pra finalizar'
  if (somenteDigitos(formulario.telefone).length < 10) return 'Preencha seu WhatsApp com DDD'
  if (formulario.tipoDeEntrega === 'Entrega' && formulario.endereco.trim() === '') return 'Preencha o endereço de entrega'

  if (formulario.formaDePagamento === 'Dinheiro') {
    const troco = lerTroco(formulario.troco)
    const total = totalDoCarrinho(itens)
    if (troco !== null && (Number.isNaN(troco) || troco < total)) {
      return `O troco precisa ser maior ou igual ao total (${formatBRL(total)}).`
    }
  }

  return null
}

function textoOuNulo(texto: string): string | null {
  const limpo = texto.trim()
  return limpo === '' ? null : limpo
}

// Avulso preenche so `opcaoId`; marmita preenche `tamanhoId` e `componentesIds`; nunca os dois.
export function montarPayloadDoPedido(cardapioId: number, itens: readonly ItemDoCarrinho[], formulario: FormularioDoPedido): CriarPedidoRequest {
  const entrega = formulario.tipoDeEntrega === 'Entrega'
  const troco = formulario.formaDePagamento === 'Dinheiro' ? lerTroco(formulario.troco) : null

  const itensDoPedido: ItemDoPedidoRequest[] = itens.map((item) =>
    item.tipo === 'marmita'
      ? { tamanhoId: item.tamanhoId, componentesIds: [...item.componentesIds], quantidade: item.quantidade }
      : { opcaoId: item.opcaoId, quantidade: item.quantidade },
  )

  return {
    nomeCliente: formulario.nome.trim(),
    telefone: somenteDigitos(formulario.telefone),
    cardapioId,
    itens: itensDoPedido,
    formaDePagamento: formulario.formaDePagamento,
    trocoPara: troco === null || Number.isNaN(troco) ? null : troco,
    tipoDeEntrega: formulario.tipoDeEntrega,
    // endereco e referencia so existem na entrega: ao trocar para Retirada, saem do payload
    endereco: entrega ? textoOuNulo(formulario.endereco) : null,
    referencia: entrega ? textoOuNulo(formulario.referencia) : null,
    observacao: textoOuNulo(formulario.observacao),
  }
}
