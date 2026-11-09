import { Navigate } from 'react-router-dom'
import { primeiraAbaPermitida } from '../../lib/permissoes'
import { useSessao } from '../auth/useSessao'
import { SemAcesso } from './SemAcesso'

// /loja: vai para a primeira aba permitida; sem nenhuma, mostra o cartao "sem acesso"
export function IndiceDaLoja() {
  const { usuario } = useSessao()
  if (!usuario) return null

  const primeira = primeiraAbaPermitida(usuario)
  return primeira ? <Navigate to={primeira.caminho} replace /> : <SemAcesso />
}
