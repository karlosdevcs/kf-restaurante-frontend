import { requisitar } from './client'
import type { AlterarOpcaoRequest, CriarOpcaoRequest, Opcao } from './tipos'

// ler opcoes exige login (o cliente ve as opcoes pelo cardapio do dia, que e aberto)

export function listarOpcoes(sinal?: AbortSignal): Promise<Opcao[]> {
  return requisitar<Opcao[]>('/opcoes', { autenticada: true, sinal })
}

export function buscarOpcao(id: number, sinal?: AbortSignal): Promise<Opcao> {
  return requisitar<Opcao>(`/opcoes/${id}`, { autenticada: true, sinal })
}

// GerenciarCadastros
export function criarOpcao(dados: CriarOpcaoRequest): Promise<Opcao> {
  return requisitar<Opcao>('/opcoes', { metodo: 'POST', corpo: dados, autenticada: true })
}

// GerenciarCadastros
export function alterarOpcao(id: number, dados: AlterarOpcaoRequest): Promise<Opcao> {
  return requisitar<Opcao>(`/opcoes/${id}`, { metodo: 'PUT', corpo: dados, autenticada: true })
}

// EsgotarOpcoes
export function alterarEsgotado(id: number, esgotado: boolean): Promise<Opcao> {
  return requisitar<Opcao>(`/opcoes/${id}/esgotado`, { metodo: 'PATCH', corpo: { esgotado }, autenticada: true })
}
