import type { CriarPedidoRequest, Pedido, PedidoResumo, StatusPedido } from '../types/api'
import { requisitar } from './client'

// sem data, o backend usa o dia de hoje no fuso de Brasilia
export function listarPedidos(filtro: { data?: string; status?: StatusPedido } = {}): Promise<PedidoResumo[]> {
  return requisitar<PedidoResumo[]>('/pedidos', { query: filtro })
}

export function buscarPedido(id: number): Promise<Pedido> {
  return requisitar<Pedido>(`/pedidos/${id}`)
}

export function criarPedido(dados: CriarPedidoRequest): Promise<Pedido> {
  return requisitar<Pedido>('/pedidos', { method: 'POST', body: dados })
}

export function marcarComoEnviado(id: number): Promise<void> {
  return requisitar<void>(`/pedidos/${id}/enviado`, { method: 'POST' })
}
