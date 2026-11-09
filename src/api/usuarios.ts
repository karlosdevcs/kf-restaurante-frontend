import { requisitar } from './client'
import type { AlterarUsuarioRequest, CriarUsuarioRequest, RedefinirSenhaRequest, Usuario } from './tipos'

// area de dono e superuser: tudo exige login

export function listarUsuarios(sinal?: AbortSignal): Promise<Usuario[]> {
  return requisitar<Usuario[]>('/usuarios', { autenticada: true, sinal })
}

export function buscarUsuario(id: number, sinal?: AbortSignal): Promise<Usuario> {
  return requisitar<Usuario>(`/usuarios/${id}`, { autenticada: true, sinal })
}

export function criarUsuario(dados: CriarUsuarioRequest): Promise<Usuario> {
  return requisitar<Usuario>('/usuarios', { metodo: 'POST', corpo: dados, autenticada: true })
}

// a lista de permissoes SUBSTITUI a atual
export function alterarUsuario(id: number, dados: AlterarUsuarioRequest): Promise<Usuario> {
  return requisitar<Usuario>(`/usuarios/${id}`, { metodo: 'PUT', corpo: dados, autenticada: true })
}

export function desativarUsuario(id: number): Promise<Usuario> {
  return requisitar<Usuario>(`/usuarios/${id}/desativar`, { metodo: 'POST', autenticada: true })
}

export function ativarUsuario(id: number): Promise<Usuario> {
  return requisitar<Usuario>(`/usuarios/${id}/ativar`, { metodo: 'POST', autenticada: true })
}

// redefinir tambem destrava a conta
export function redefinirSenha(id: number, dados: RedefinirSenhaRequest): Promise<void> {
  return requisitar<void>(`/usuarios/${id}/senha`, { metodo: 'PUT', corpo: dados, autenticada: true })
}
