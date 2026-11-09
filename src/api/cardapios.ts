import type { CardapioDoDia } from '../types/api'
import { ApiError, requisitar } from './client'

// null = nao ha cardapio publicado (ou fechado) hoje. A API devolve 404 tambem para rascunho.
export async function buscarCardapioHoje(): Promise<CardapioDoDia | null> {
  try {
    return await requisitar<CardapioDoDia>('/cardapios/hoje')
  } catch (erro) {
    if (erro instanceof ApiError && erro.status === 404) {
      return null
    }
    throw erro
  }
}

export function criarCardapioHoje(opcoesIds: number[]): Promise<CardapioDoDia> {
  return requisitar<CardapioDoDia>('/cardapios', { method: 'POST', body: { opcoesIds } })
}

export function publicarCardapio(id: number): Promise<CardapioDoDia> {
  return requisitar<CardapioDoDia>(`/cardapios/${id}/publicar`, { method: 'POST' })
}

export function fecharCardapio(id: number): Promise<CardapioDoDia> {
  return requisitar<CardapioDoDia>(`/cardapios/${id}/fechar`, { method: 'POST' })
}
