import { useContext } from 'react'
import type { Permissao } from '../../api/tipos'
import { ehGestor } from '../../lib/permissoes'
import { AuthContext, type ValorDaSessao } from './AuthContext'

export function useSessao(): ValorDaSessao {
  const valor = useContext(AuthContext)
  if (!valor) throw new Error('useSessao precisa estar dentro do AuthProvider')
  return valor
}

export function usePermissoes(): Permissao[] {
  return useSessao().usuario?.permissoes ?? []
}

export function usePermissao(permissao: Permissao): boolean {
  return usePermissoes().includes(permissao)
}

// papel Dono ou Superuser
export function useEhGestor(): boolean {
  return ehGestor(useSessao().usuario?.papel)
}
