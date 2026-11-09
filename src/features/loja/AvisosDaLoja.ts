import { createContext, useContext } from 'react'

// Banner de erro no topo da area de conteudo da loja: toda mutacao que falha mostra a mensagem do ProblemDetails aqui.
export interface AvisosDaLoja {
  erro: string | null
  mostrarErro: (mensagem: string) => void
  limparErro: () => void
  /** texto lido pelo leitor de tela (regiao aria-live), sem aparecer na tela */
  anuncio: string
  anunciar: (mensagem: string) => void
}

export const AvisosContext = createContext<AvisosDaLoja | null>(null)

export function useAvisosDaLoja(): AvisosDaLoja {
  const valor = useContext(AvisosContext)
  if (!valor) throw new Error('useAvisosDaLoja precisa estar dentro do LojaLayout')
  return valor
}
