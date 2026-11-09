import type { Pedido } from '../../api/tipos'

// So para a tela de confirmacao sobreviver a um recarregamento acidental (spec, 12.5). A API nao deixa o cliente
// reler o pedido (GET /pedidos/{id} exige login), entao a resposta do POST e a unica fonte. Some ao fechar a aba.
const CHAVE = 'kf:ultimo-pedido'

export function guardarUltimoPedido(pedido: Pedido): void {
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify(pedido))
  } catch {
    // sem armazenamento: a confirmacao vale so em memoria
  }
}

export function lerUltimoPedido(): Pedido | null {
  try {
    const texto = sessionStorage.getItem(CHAVE)
    if (!texto) return null
    const dados: unknown = JSON.parse(texto)
    if (dados && typeof dados === 'object' && 'numero' in dados && 'mensagemWhatsApp' in dados) return dados as Pedido
  } catch {
    // JSON quebrado: ignora
  }
  return null
}

export function limparUltimoPedido(): void {
  try {
    sessionStorage.removeItem(CHAVE)
  } catch {
    // nada a limpar
  }
}
