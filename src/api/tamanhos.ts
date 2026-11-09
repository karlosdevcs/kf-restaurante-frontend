import type { TamanhoMarmita } from '../types/api'
import { requisitar } from './client'

export function listarTamanhos(): Promise<TamanhoMarmita[]> {
  return requisitar<TamanhoMarmita[]>('/tamanhos')
}
