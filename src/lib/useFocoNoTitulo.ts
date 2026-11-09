import { useEffect, useRef } from 'react'
import { useIsDesktop } from './useIsDesktop'

// Ao trocar de tela no CELULAR, o foco vai para o titulo da tela nova (spec, 15.7): quem usa leitor de tela ou teclado
// sabe onde esta. A primeira tela da pagina nao rouba o foco do navegador. No computador nao faz nada: la a troca de
// aba e feita no proprio tablist, e tirar o foco dele atrapalharia a navegacao por setas.
let primeiraTela = true

// so para os testes, que montam varias "paginas" no mesmo processo
export function reiniciarFocoDeTela() {
  primeiraTela = true
}

/** `pronto`: `false` enquanto o titulo ainda nao existe (dados carregando). O foco vai uma vez, quando ele aparecer. */
export function useFocoNoTitulo(pronto = true) {
  const titulo = useRef<HTMLHeadingElement>(null)
  const jaTratou = useRef(false)
  const desktop = useIsDesktop()

  useEffect(() => {
    if (desktop || !pronto || jaTratou.current) return
    jaTratou.current = true

    if (primeiraTela) {
      primeiraTela = false
      return
    }
    titulo.current?.focus({ preventScroll: true })
  }, [desktop, pronto])

  return titulo
}
