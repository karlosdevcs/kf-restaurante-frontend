import { requisitar } from './client'
import type { AlterarLimitesRequest, AlterarTamanhoRequest, CriarTamanhoRequest, Tamanho } from './tipos'

// ler tamanhos e ABERTO: o cliente precisa deles para montar a marmita

export function listarTamanhos(sinal?: AbortSignal): Promise<Tamanho[]> {
  return requisitar<Tamanho[]>('/tamanhos', { sinal })
}

export function buscarTamanho(id: number, sinal?: AbortSignal): Promise<Tamanho> {
  return requisitar<Tamanho>(`/tamanhos/${id}`, { sinal })
}

// GerenciarCadastros
export function criarTamanho(dados: CriarTamanhoRequest): Promise<Tamanho> {
  return requisitar<Tamanho>('/tamanhos', { metodo: 'POST', corpo: dados, autenticada: true })
}

// GerenciarCadastros
export function alterarTamanho(id: number, dados: AlterarTamanhoRequest): Promise<Tamanho> {
  return requisitar<Tamanho>(`/tamanhos/${id}`, { metodo: 'PUT', corpo: dados, autenticada: true })
}

// GerenciarCadastros: a lista SUBSTITUI os limites atuais (lista vazia remove todos)
export function alterarLimites(id: number, dados: AlterarLimitesRequest): Promise<Tamanho> {
  return requisitar<Tamanho>(`/tamanhos/${id}/limites`, { metodo: 'PUT', corpo: dados, autenticada: true })
}
