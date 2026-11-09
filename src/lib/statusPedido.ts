import type { PedidoResumo, StatusPedido } from '../api/tipos'

// `Gerado` e `Enviado` (spec, seção 11.1): o sistema nao enxerga o WhatsApp. "Gerado" e o pedido que a API
// registrou mas que o cliente ainda nao tocou em "Enviar"; "Enviado" e depois do toque.

export type TomDoStatus = 'neutro' | 'aviso'

export function infoDoStatus(status: StatusPedido): { rotulo: string; tom: TomDoStatus } {
  if (status === 'Enviado') return { rotulo: 'Enviado', tom: 'neutro' }
  if (status === 'Gerado') return { rotulo: 'Não enviado', tom: 'aviso' }
  // status novo no backend: mostra o proprio nome, sem quebrar
  return { rotulo: status, tom: 'neutro' }
}

export type FiltroDeStatus = 'todos' | 'enviado' | 'naoEnviado'

export interface ContadoresDeStatus {
  todos: number
  enviado: number
  naoEnviado: number
}

// contadores das pilulas de filtro da aba Pedidos
export function contarPorStatus(pedidos: PedidoResumo[]): ContadoresDeStatus {
  return {
    todos: pedidos.length,
    enviado: pedidos.filter((p) => p.status === 'Enviado').length,
    naoEnviado: pedidos.filter((p) => p.status === 'Gerado').length,
  }
}

export function filtrarPorStatus(pedidos: PedidoResumo[], filtro: FiltroDeStatus): PedidoResumo[] {
  if (filtro === 'enviado') return pedidos.filter((p) => p.status === 'Enviado')
  if (filtro === 'naoEnviado') return pedidos.filter((p) => p.status === 'Gerado')
  return pedidos
}
