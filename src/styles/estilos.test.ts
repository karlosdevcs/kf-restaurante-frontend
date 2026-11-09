import { readFileSync } from 'node:fs'

// Le o CSS do disco: o plugin do Tailwind processa `import '...css?raw'` e remove as utilidades customizadas do texto.
// O arquivo pode estar com quebra de linha do Windows.
const base = readFileSync('src/styles/base.css', 'utf-8').replace(/\r\n/g, '\n')

// O jsdom nao processa CSS, entao um erro de estilo como este so aparecia no navegador de verdade: a utilidade da area de
// toque usava um ::after absoluto sem `position: relative` no proprio elemento, e o pseudo-elemento cobria a tela e
// roubava o clique de outros botoes. Este teste garante que o `relative` fica na utilidade.

function bloco(nome: string): string {
  const inicio = base.indexOf(`@utility ${nome} {`)
  expect(inicio).toBeGreaterThanOrEqual(0)
  return base.slice(inicio, base.indexOf('\n}\n', inicio))
}

describe('area de toque de 44px', () => {
  it.each(['toque-v', 'toque-q'])('%s ancora o pseudo-elemento no proprio elemento (position: relative)', (nome) => {
    expect(bloco(nome)).toMatch(/position:\s*relative/)
  })

  it('o pseudo-elemento so estende (min(0px, ...)): controle que ja tem 44px ou mais nao encolhe', () => {
    expect(bloco('toque-v')).toContain('min(0px,')
    expect(bloco('toque-q')).toContain('min(0px,')
  })
})
