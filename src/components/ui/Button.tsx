import type { AnchorHTMLAttributes, ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import { botaoClasses, estiloDeToque, type AlturaDeBotao, type RaioDeBotao, type VarianteDeBotao } from './botaoClasses'

interface PropsDeEstilo {
  variante?: VarianteDeBotao
  altura?: AlturaDeBotao
  raio?: RaioDeBotao
  larguraTotal?: boolean
}

interface PropsDoBotao extends PropsDeEstilo, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode
  /** acao em andamento: o botao fica desabilitado e mostra `rotuloOcupado` ("Enviando...", "Entrando...", "Salvando...") */
  ocupado?: boolean
  rotuloOcupado?: string
}

export function Button({
  variante = 'primary-ink',
  altura = 46,
  raio = 'pilula',
  larguraTotal = false,
  ocupado = false,
  rotuloOcupado,
  disabled,
  className,
  style,
  type = 'button',
  children,
  ...resto
}: PropsDoBotao) {
  return (
    <button
      type={type}
      disabled={disabled || ocupado}
      aria-busy={ocupado || undefined}
      className={botaoClasses({ variante, altura, raio, larguraTotal, className })}
      style={{ ...estiloDeToque(altura), ...style } as CSSProperties}
      {...resto}
    >
      {ocupado && rotuloOcupado ? rotuloOcupado : children}
    </button>
  )
}

interface PropsDoLink extends PropsDeEstilo, Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'href'> {
  href: string
  children: ReactNode
}

// Link com aparencia de botao. O "Enviar no WhatsApp" e um <a href target="_blank"> de verdade (spec, 12.5):
// assim o navegador nao bloqueia a abertura como bloquearia um window.open feito depois de uma chamada assincrona.
export function LinkButton({
  variante = 'whatsapp',
  altura = 52,
  raio = 'pilula',
  larguraTotal = false,
  className,
  style,
  children,
  ...resto
}: PropsDoLink) {
  return (
    <a
      className={botaoClasses({ variante, altura, raio, larguraTotal, className })}
      style={{ ...estiloDeToque(altura), ...style } as CSSProperties}
      {...resto}
    >
      {children}
    </a>
  )
}
