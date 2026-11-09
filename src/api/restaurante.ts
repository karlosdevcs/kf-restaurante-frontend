import type { Restaurante } from '../types/api'
import { requisitar } from './client'

export function buscarRestaurante(): Promise<Restaurante> {
  return requisitar<Restaurante>('/restaurante')
}

export function abrirRestaurante(): Promise<Restaurante> {
  return requisitar<Restaurante>('/restaurante/abrir', { method: 'POST' })
}

export function fecharRestaurante(): Promise<Restaurante> {
  return requisitar<Restaurante>('/restaurante/fechar', { method: 'POST' })
}

export function alterarWhatsApp(whatsApp: string): Promise<Restaurante> {
  return requisitar<Restaurante>('/restaurante/whatsapp', { method: 'PUT', body: { whatsApp } })
}
