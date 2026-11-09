import { requisitar } from './client'
import type { Restaurante } from './tipos'

// ABERTO
export function buscarRestaurante(sinal?: AbortSignal): Promise<Restaurante> {
  return requisitar<Restaurante>('/restaurante', { sinal })
}

// AbrirFecharLoja. Abrir sem WhatsApp cadastrado volta 400.
export function abrirRestaurante(): Promise<Restaurante> {
  return requisitar<Restaurante>('/restaurante/abrir', { metodo: 'POST', autenticada: true })
}

// AbrirFecharLoja
export function fecharRestaurante(): Promise<Restaurante> {
  return requisitar<Restaurante>('/restaurante/fechar', { metodo: 'POST', autenticada: true })
}

// AlterarWhatsApp: aceita com ou sem formatacao
export function alterarWhatsApp(whatsApp: string): Promise<Restaurante> {
  return requisitar<Restaurante>('/restaurante/whatsapp', { metodo: 'PUT', corpo: { whatsApp }, autenticada: true })
}
