import type { CSSProperties } from 'react'
import { cx } from '../../lib/cx'

// Stepper de quantidade do PRODUTO no computador (spec, seção 8): borda line, raio total, padding 4 6, gap 10,
// botoes redondos de 30 em `canvas`, contagem 15/700. Minimo 1.
export function Stepper({
  valor,
  aoMudar,
  rotulo,
  minimo = 1,
}: {
  valor: number
  aoMudar: (novo: number) => void
  /** descreve o grupo para leitores de tela, ex.: "Quantidade de Marmita M" */
  rotulo: string
  minimo?: number
}) {
  const estiloBotao = { '--lado': '30px' } as CSSProperties
  const classeBotao =
    'toque-q relative grid h-[30px] w-[30px] place-items-center rounded-full bg-canvas text-[16px] font-bold leading-none text-ink transition-colors hover:bg-line disabled:text-disabled-fg'

  return (
    <div role="group" aria-label={rotulo} className="inline-flex items-center gap-[10px] rounded-pilula border border-line px-[6px] py-1">
      <button type="button" aria-label="Diminuir quantidade" disabled={valor <= minimo} onClick={() => aoMudar(valor - 1)} className={classeBotao} style={estiloBotao}>
        −
      </button>
      <span aria-live="polite" className="min-w-4 text-center text-[15px] font-bold">
        {valor}
      </span>
      <button type="button" aria-label="Aumentar quantidade" onClick={() => aoMudar(valor + 1)} className={classeBotao} style={estiloBotao}>
        +
      </button>
    </div>
  )
}

// Stepper de LINHA do carrinho: botoes redondos de 24 (computador) ou 26 (celular), borda line, fundo branco,
// contagem 13/700. Chegar a 0 remove o item: `aoMudar(0)` e a deixa de quem usa decidir remover.
export function LineStepper({
  valor,
  aoMudar,
  nomeDoItem,
  tamanho = 'desktop',
}: {
  valor: number
  aoMudar: (novo: number) => void
  nomeDoItem: string
  tamanho?: 'desktop' | 'celular'
}) {
  const lado = tamanho === 'desktop' ? 24 : 26
  const estilo = { '--lado': `${lado}px` } as CSSProperties
  const classeBotao = cx(
    'toque-q relative grid place-items-center rounded-full border border-line bg-white text-[14px] font-bold leading-none text-ink transition-colors hover:bg-surface',
    tamanho === 'desktop' ? 'h-6 w-6' : 'h-[26px] w-[26px]',
  )

  return (
    <div role="group" aria-label={`Quantidade de ${nomeDoItem}`} className="inline-flex items-center gap-2">
      <button type="button" aria-label={`Diminuir quantidade de ${nomeDoItem}`} onClick={() => aoMudar(valor - 1)} className={classeBotao} style={estilo}>
        −
      </button>
      <span aria-live="polite" className="min-w-[14px] text-center text-[13px] font-bold">
        {valor}
      </span>
      <button type="button" aria-label={`Aumentar quantidade de ${nomeDoItem}`} onClick={() => aoMudar(valor + 1)} className={classeBotao} style={estilo}>
        +
      </button>
    </div>
  )
}
