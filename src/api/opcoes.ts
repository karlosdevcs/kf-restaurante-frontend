import type { AlterarOpcaoRequest, CriarOpcaoRequest, Opcao } from '../types/api'
import { requisitar } from './client'

export function listarOpcoes(): Promise<Opcao[]> {
  return requisitar<Opcao[]>('/opcoes')
}

export function criarOpcao(dados: CriarOpcaoRequest): Promise<Opcao> {
  return requisitar<Opcao>('/opcoes', { method: 'POST', body: dados })
}

export function alterarOpcao(id: number, dados: AlterarOpcaoRequest): Promise<Opcao> {
  return requisitar<Opcao>(`/opcoes/${id}`, { method: 'PUT', body: dados })
}

export function alterarEsgotado(id: number, esgotado: boolean): Promise<Opcao> {
  return requisitar<Opcao>(`/opcoes/${id}/esgotado`, { method: 'PATCH', body: { esgotado } })
}
