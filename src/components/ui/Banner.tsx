import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'

export type TipoDeBanner = 'erro' | 'sucesso' | 'aviso' | 'info'

const ESTILO: Record<TipoDeBanner, string> = {
  erro: 'bg-brand-tint text-brand-strong',
  sucesso: 'bg-success-bg text-success-text',
  aviso: 'bg-warn-bg text-warn-text',
  info: 'bg-surface text-muted',
}

// Mensagem na tela (spec, seção 8): raio 12, padding 12 14, 14/600.
// `erro` usa role="alert" (anunciado na hora); os demais usam role="status".
export function Banner({ tipo = 'info', className, children }: { tipo?: TipoDeBanner; className?: string; children: ReactNode }) {
  return (
    <div role={tipo === 'erro' ? 'alert' : 'status'} className={cx('rounded-escolha px-[14px] py-3 text-[14px] font-semibold', ESTILO[tipo], className)}>
      {children}
    </div>
  )
}
