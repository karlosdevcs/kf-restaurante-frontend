import { createContext } from 'react'
import type { Usuario } from '../../api/tipos'

// chave do GET /auth/eu no cache do TanStack Query
export const CHAVE_DO_USUARIO = ['eu'] as const

// 'sem-sessao'  : ninguem logado
// 'carregando'  : ha token guardado e o GET /auth/eu ainda nao respondeu
// 'pronto'      : usuario conhecido (fonte de verdade de quem e e do que pode)
// 'erro'        : ha token, mas o GET /auth/eu falhou por motivo que nao e 401 (rede, 500)
export type EstadoDaSessao = 'sem-sessao' | 'carregando' | 'pronto' | 'erro'

// por que nao ha sessao: ajuda a tela de login a explicar e a nao voltar para a pagina anterior depois de "Sair"
export type MotivoDoFim = 'expirou' | 'saiu'

export interface ValorDaSessao {
  estado: EstadoDaSessao
  usuario: Usuario | null
  motivoDoFim: MotivoDoFim | null
  /** mensagem do ultimo 403 (ex.: "Você não tem permissão para fazer isso."); a tela mostra num Banner */
  avisoProibido: string | null
  dispensarAviso: () => void
  /** POST /auth/login. Lanca ApiError quando falha; em caso de sucesso guarda a sessao */
  entrar: (email: string, senha: string) => Promise<void>
  /** limpa sessionStorage, memoria e todo o cache do TanStack Query */
  sair: () => void
  /** refaz o GET /auth/eu */
  atualizarUsuario: () => void
}

export const AuthContext = createContext<ValorDaSessao | null>(null)
