import type { Categoria } from '../../api/tipos'
import { categoriaInfo } from '../../lib/categoriaConfig'
import { cx } from '../../lib/cx'
import { IconeCheck } from './icones'

interface PropsDoTile {
  nome: string
  categoria: Categoria
  marcado: boolean
  /** nao marcado e (esgotado ou limite atingido): quem calcula e `regrasMarmita` */
  bloqueado?: boolean
  esgotado?: boolean
  onAlternar: () => void
}

// Ingrediente na montagem da marmita (spec, seção 8): w76, raio 14, circulo de 32 na cor da categoria.
// Marcado: borda ink, fundo tile-selected-bg, circulo ink com check. Esgotado: "Nome (acabou)" e bloqueado.
export function IngredientTile({ nome, categoria, marcado, bloqueado = false, esgotado = false, onAlternar }: PropsDoTile) {
  const cor = categoriaInfo(categoria).cor
  const rotulo = esgotado ? `${nome} (acabou)` : nome

  return (
    <button
      type="button"
      aria-pressed={marcado}
      disabled={bloqueado}
      onClick={onAlternar}
      className={cx(
        'flex w-[76px] flex-col items-center gap-[6px] rounded-tile border px-1 py-[10px] text-center transition-colors',
        marcado ? 'border-ink bg-tile-selected-bg' : 'border-line bg-white',
        bloqueado && 'cursor-not-allowed',
      )}
    >
      <span
        className="grid h-8 w-8 place-items-center rounded-full text-white"
        style={{ backgroundColor: marcado ? 'var(--ink)' : cor }}
        aria-hidden="true"
      >
        {marcado ? <IconeCheck tamanho={16} espessura={3} /> : null}
      </span>
      <span className={cx('text-[11.5px] leading-[1.2] font-semibold', bloqueado ? 'text-blocked' : 'text-ink')}>{rotulo}</span>
    </button>
  )
}
