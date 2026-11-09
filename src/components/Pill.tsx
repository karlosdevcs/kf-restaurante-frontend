import type { ReactNode } from 'react'

interface Props {
  ativo: boolean
  onClick: () => void
  children: ReactNode
}

// botao em pilula usado em filtros e escolhas (categoria, status, forma de pagamento...)
export function Pill({ ativo, onClick, children }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={
        'whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors ' +
        (ativo
          ? 'border-texto-principal bg-texto-principal text-white'
          : 'border-borda-media bg-white text-texto-principal hover:border-texto-terciario')
      }
    >
      {children}
    </button>
  )
}
