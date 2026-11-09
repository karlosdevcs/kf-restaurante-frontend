import type { ItemDoPedido, Pedido, PedidoResumo } from '../api/tipos'
import { formatBRL, rotuloPagamento, somenteDigitos } from './formatar'

// Textos da aba Pedidos (spec, 11.1). O resumo da lista nao traz itens, endereco, referencia, observacao nem troco:
// esses campos so existem no detalhe (`Pedido`), buscado sob demanda.

// "1x Marmita G (Arroz, Feijao), 2x Coca-Cola": avulso sem parenteses
export function resumoDosItens(itens: readonly ItemDoPedido[]): string {
  return itens.map((item) => `${item.quantidade}x ${item.nome}${item.componentes ? ` (${item.componentes})` : ''}`).join(', ')
}

// "Entrega, Rua A, 10 · Dinheiro, troco para R$ 100,00" ou "Retirada · Pix".
// Sem o detalhe ainda (carregando), usa so o que o resumo tem: tipo de entrega e forma de pagamento.
export function linhaDeEntregaEPagamento(resumo: Pick<PedidoResumo, 'tipoDeEntrega' | 'formaDePagamento'>, detalhe?: Pick<Pedido, 'endereco' | 'trocoPara'>): string {
  const entrega = resumo.tipoDeEntrega === 'Entrega' ? (detalhe?.endereco ? `Entrega, ${detalhe.endereco}` : 'Entrega') : 'Retirada'

  let pagamento = rotuloPagamento(resumo.formaDePagamento)
  if (resumo.formaDePagamento === 'Dinheiro' && detalhe) {
    pagamento += detalhe.trocoPara ? `, troco para ${formatBRL(detalhe.trocoPara)}` : ', sem troco'
  }

  return `${entrega} · ${pagamento}`
}

// "Ola, {nome}! Aqui e do KF Restaurante, sobre o seu pedido nº {numero}."
export function mensagemParaOCliente(nome: string, numero: number): string {
  return `Olá, ${nome}! Aqui é do KF Restaurante, sobre o seu pedido nº ${numero}.`
}

// O telefone do pedido e so DDD e numero: acrescenta o 55 do Brasil na frente.
export function linkParaChamarOCliente(resumo: Pick<PedidoResumo, 'telefone' | 'nomeCliente' | 'numero'>): string {
  const texto = encodeURIComponent(mensagemParaOCliente(resumo.nomeCliente, resumo.numero))
  return `https://wa.me/55${somenteDigitos(resumo.telefone)}?text=${texto}`
}
