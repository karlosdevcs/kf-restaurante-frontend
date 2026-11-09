// jsdom nao implementa matchMedia. Este stub deixa o teste escolher o layout (celular ou computador)
// do hook useIsDesktop. Cada teste que precisa do computador chama definirDesktop(true).
export function definirDesktop(desktop: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (consulta: string) => ({
      matches: desktop,
      media: consulta,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
      onchange: null,
    }),
  })
}

export function removerMatchMedia() {
  // @ts-expect-error o jsdom nao define; remover devolve o ambiente ao estado original
  delete window.matchMedia
}
