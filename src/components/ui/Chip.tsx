import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'

// Chip de permissao ou papel (spec, seção 8): padding 4 10, raio total, 12/600.
//   permissao : fundo surface, borda line-soft, texto ink
//   papel     : status-neutral (Dono e Funcionario)
//   superuser : fundo ink, texto branco
export function Chip({ variante = 'permissao', children }: { variante?: 'permissao' | 'papel' | 'superuser'; children: ReactNode }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-pilula px-[10px] py-1 text-[12px] font-semibold whitespace-nowrap',
        variante === 'permissao' && 'border border-line-soft bg-surface text-ink',
        variante === 'papel' && 'bg-status-neutral-bg text-status-neutral-fg',
        variante === 'superuser' && 'bg-ink text-white',
      )}
    >
      {children}
    </span>
  )
}
