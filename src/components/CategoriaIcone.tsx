import type { Categoria } from '../types/api'

const COR: Record<Categoria, string> = {
  Carne: 'bg-categoria-carne',
  Acompanhamento: 'bg-categoria-acompanhamento',
  Guarnicao: 'bg-categoria-guarnicao',
  Salada: 'bg-categoria-salada',
  Bebida: 'bg-categoria-bebida',
  Sobremesa: 'bg-categoria-sobremesa',
}

interface Props {
  categoria: Categoria
  nome: string
  marcado?: boolean
  tamanho?: 'sm' | 'md'
}

// circulo colorido no lugar de foto (ate termos fotos de verdade). Preto quando marcado.
export function CategoriaIcone({ categoria, nome, marcado = false, tamanho = 'md' }: Props) {
  const dimensao = tamanho === 'sm' ? 'h-9 w-9 text-sm' : 'h-11 w-11 text-base'

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${dimensao} ${
        marcado ? 'bg-texto-principal text-white' : `${COR[categoria]} text-texto-principal`
      }`}
    >
      {marcado ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12l5 5L20 7" />
        </svg>
      ) : (
        nome.charAt(0).toUpperCase()
      )}
    </span>
  )
}
