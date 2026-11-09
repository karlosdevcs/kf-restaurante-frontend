import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import { cx } from '../../lib/cx'

interface PropsDeEscolha extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  ativo: boolean
  children: ReactNode
}

// Seletor de tamanho (spec, seção 8): h40 (computador) ou h36 (celular), raio 10, 14/700.
export function SizeButton({
  ativo,
  tamanho = 'desktop',
  className,
  style,
  children,
  ...resto
}: PropsDeEscolha & { tamanho?: 'desktop' | 'celular' }) {
  const desktop = tamanho === 'desktop'

  return (
    <button
      type="button"
      aria-pressed={ativo}
      className={cx(
        'toque-v relative inline-flex items-center justify-center rounded-tamanho border text-[14px] font-bold transition-colors',
        desktop ? 'h-[40px] px-[18px]' : 'h-[36px] px-[14px]',
        ativo ? 'border-ink bg-ink text-white' : 'border-line hover:bg-surface bg-white text-ink',
        className,
      )}
      style={{ '--h': desktop ? '40px' : '36px', ...style } as CSSProperties}
      {...resto}
    >
      {children}
    </button>
  )
}

// Botao de escolha numa grade: Retirada/Entrega, pagamento, categoria e papel nos cadastros.
// altura 44 (cliente) ou 38 a 44 (loja); raio 12 (cliente) ou 10 (loja); texto 14/700 (pagamento 13/700; categoria 13/600).
export function ChoiceButton({
  ativo,
  altura = 44,
  raio = 'cliente',
  texto = 'padrao',
  className,
  style,
  children,
  ...resto
}: PropsDeEscolha & {
  altura?: 38 | 40 | 44
  raio?: 'cliente' | 'loja'
  texto?: 'padrao' | 'pagamento' | 'categoria'
}) {
  const alturaClasse = altura === 44 ? 'h-[44px]' : altura === 40 ? 'h-[40px]' : 'h-[38px]'
  const textoClasse =
    texto === 'pagamento' ? 'px-1 text-[13px] font-bold' : texto === 'categoria' ? 'px-3 text-[13px] font-semibold' : 'px-3 text-[14px] font-bold'

  return (
    <button
      type="button"
      aria-pressed={ativo}
      className={cx(
        'relative inline-flex items-center justify-center border transition-colors',
        altura < 44 && 'toque-v',
        alturaClasse,
        textoClasse,
        raio === 'cliente' ? 'rounded-escolha' : 'rounded-tamanho',
        ativo ? 'border-ink bg-ink text-white' : 'border-line hover:bg-surface bg-white text-ink',
        className,
      )}
      style={altura < 44 ? ({ '--h': `${altura}px`, ...style } as CSSProperties) : style}
      {...resto}
    >
      {children}
    </button>
  )
}
