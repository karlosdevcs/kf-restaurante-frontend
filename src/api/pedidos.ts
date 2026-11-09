import { requisitar } from './client'
import type { CriarPedidoRequest, Pedido, PedidoResumo, StatusPedido } from './tipos'

// ABERTO (e o que o cliente usa): a resposta traz mensagemWhatsApp e linkWhatsApp prontos
export function criarPedido(dados: CriarPedidoRequest): Promise<Pedido> {
  return requisitar<Pedido>('/pedidos', { metodo: 'POST', corpo: dados })
}

// ABERTO e idempotente: o cliente avisa que tocou em "Enviar no WhatsApp"
export function marcarComoEnviado(id: number): Promise<void> {
  return requisitar<void>(`/pedidos/${id}/enviado`, { metodo: 'POST' })
}

// VerPedidos. Sem `data`, a API usa o hoje de Brasilia (data no formato YYYY-MM-DD).
export function listarPedidos(filtro: { data?: string; status?: StatusPedido } = {}, sinal?: AbortSignal): Promise<PedidoResumo[]> {
  return requisitar<PedidoResumo[]>('/pedidos', { autenticada: true, consulta: filtro, sinal })
}

// VerPedidos
export function buscarPedido(id: number, sinal?: AbortSignal): Promise<Pedido> {
  return requisitar<Pedido>(`/pedidos/${id}`, { autenticada: true, sinal })
}
