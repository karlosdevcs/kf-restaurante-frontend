import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import { cx } from '../../lib/cx'

interface PropsDePilula extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  ativa: boolean
  children: ReactNode
}

// Filtro de categoria (spec, seção 8). Computador: h40 px18 14/600. Celular: h36 px14 13/600.
// A fileira de pilulas rola na horizontal (overflow-x: auto): por isso `whitespace-nowrap` e `shrink-0`.
export function FilterPill({
  ativa,
  tamanho = 'desktop',
  className,
  style,
  children,
  ...resto
}: PropsDePilula & { tamanho?: 'desktop' | 'celular' }) {
  const desktop = tamanho === 'desktop'

  return (
    <button
      type="button"
      aria-pressed={ativa}
      className={cx(
        'toque-v relative inline-flex shrink-0 items-center rounded-pilula border font-semibold whitespace-nowrap transition-colors',
        desktop ? 'h-[40px] px-[18px] text-[14px]' : 'h-[36px] px-[14px] text-[13px]',
        ativa ? 'border-brand bg-brand-tint text-brand-strong' : 'border-line hover:bg-surface bg-white text-ink',
        className,
      )}
      style={{ '--h': desktop ? '40px' : '36px', ...style } as CSSProperties}
      {...resto}
    >
      {children}
    </button>
  )
}

// Navegacao do topo no computador do cliente: h40 px16 14/600; ativa em ink, inativa branca com borda
export function TopNavPill({ ativa, className, style, children, ...resto }: PropsDePilula) {
  return (
    <button
      type="button"
      aria-current={ativa ? 'page' : undefined}
      className={cx(
        'toque-v relative inline-flex h-[40px] items-center rounded-pilula border px-4 text-[14px] font-semibold whitespace-nowrap transition-colors',
        ativa ? 'border-ink bg-ink text-white' : 'border-line hover:bg-surface bg-white text-ink',
        className,
      )}
      style={{ '--h': '40px', ...style } as CSSProperties}
      {...resto}
    >
      {children}
    </button>
  )
}
