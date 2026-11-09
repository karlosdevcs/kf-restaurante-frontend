import { requisitar } from './client'
import type { LoginRequest, LoginResponse, TrocarSenhaRequest, Usuario } from './tipos'

// login e aberto: erro 401 aqui e "credencial errada", nao "sessao expirada"
export function entrar(dados: LoginRequest): Promise<LoginResponse> {
  return requisitar<LoginResponse>('/auth/login', { metodo: 'POST', corpo: dados })
}

export function buscarEu(sinal?: AbortSignal): Promise<Usuario> {
  return requisitar<Usuario>('/auth/eu', { autenticada: true, sinal })
}

export function trocarSenha(dados: TrocarSenhaRequest): Promise<void> {
  return requisitar<void>('/auth/trocar-senha', { metodo: 'POST', corpo: dados, autenticada: true })
}
