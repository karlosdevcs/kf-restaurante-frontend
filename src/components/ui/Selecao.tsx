import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../../lib/cx'
import { IconeCheck } from './icones'

// Checkbox de lista (cardapio, permissoes) (spec, seção 8): caixa de 20, raio 6, borda 2 ink; marcada: fundo brand
// com check branco de 12; desabilitada: borda `checkbox-disabled`. E um <button role="checkbox"> com o texto dentro.
export function ListCheckbox({
  marcado,
  onAlternar,
  desabilitado = false,
  children,
  className,
  ...resto
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'children' | 'role'> & {
  marcado: boolean
  onAlternar: () => void
  desabilitado?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={marcado}
      disabled={desabilitado}
      onClick={onAlternar}
      className={cx('flex min-h-[44px] w-full items-center gap-3 text-left', desabilitado && 'cursor-not-allowed', className)}
      {...resto}
    >
      <span
        aria-hidden="true"
        className={cx(
          'grid h-5 w-5 shrink-0 place-items-center rounded-[6px] border-2 text-white transition-colors',
          desabilitado ? 'border-checkbox-disabled' : marcado ? 'border-brand bg-brand' : 'border-ink',
          marcado && desabilitado && 'bg-checkbox-disabled',
        )}
      >
        {marcado ? <IconeCheck tamanho={12} espessura={3} /> : null}
      </span>
      <span className={cx('text-[14px] font-semibold', desabilitado ? 'text-blocked' : 'text-ink')}>{children}</span>
    </button>
  )
}
