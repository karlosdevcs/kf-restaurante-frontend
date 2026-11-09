import { useSyncExternalStore } from 'react'

// Breakpoint fixo de 1024px (spec, seção 7): o layout e ESCOLHIDO por este hook, nao por quebra de flex-wrap.
export const LARGURA_DESKTOP = 1024
const CONSULTA = `(min-width: ${LARGURA_DESKTOP}px)`

function assinar(aoMudar: () => void): () => void {
  const lista = window.matchMedia?.(CONSULTA)
  lista?.addEventListener('change', aoMudar)
  return () => lista?.removeEventListener('change', aoMudar)
}

function lerAgora(): boolean {
  return window.matchMedia?.(CONSULTA).matches ?? false
}

export function useIsDesktop(): boolean {
  // no servidor (e em ambientes sem matchMedia) assume celular
  return useSyncExternalStore(assinar, lerAgora, () => false)
}
