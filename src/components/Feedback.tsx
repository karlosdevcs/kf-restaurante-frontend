import type { ReactNode } from 'react'

// mensagem de erro legivel, perto da acao que falhou (nunca alert generico)
export function ErroInline({ mensagem }: { mensagem: string | null }) {
  if (!mensagem) return null

  return (
    <p role="alert" className="rounded-sm border border-brand/30 bg-brand/5 px-4 py-3 text-sm font-medium text-brand-hover">
      {mensagem}
    </p>
  )
}

export function Carregando({ texto = 'Carregando...' }: { texto?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-texto-secundario">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-borda-media border-t-brand" />
      <span className="text-sm font-medium">{texto}</span>
    </div>
  )
}

export function BotaoPrincipal({
  children,
  onClick,
  desabilitado = false,
  tipo = 'button',
  larguraTotal = true,
}: {
  children: ReactNode
  onClick?: () => void
  desabilitado?: boolean
  tipo?: 'button' | 'submit'
  larguraTotal?: boolean
}) {
  return (
    <button
      type={tipo}
      onClick={onClick}
      disabled={desabilitado}
      className={
        (larguraTotal ? 'w-full ' : '') +
        'rounded-full bg-brand px-6 py-3.5 text-base font-bold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-borda-media disabled:text-texto-terciario'
      }
    >
      {children}
    </button>
  )
}

export function BotaoSecundario({ children, onClick, desabilitado = false }: { children: ReactNode; onClick?: () => void; desabilitado?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desabilitado}
      className="rounded-full border border-borda-media bg-white px-4 py-2 text-sm font-semibold text-texto-principal transition-colors hover:border-texto-terciario disabled:opacity-50"
    >
      {children}
    </button>
  )
}
