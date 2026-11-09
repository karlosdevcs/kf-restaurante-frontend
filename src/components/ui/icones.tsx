import type { SVGProps } from 'react'

// Icones SVG inline (spec, seção 6): traco currentColor, pontas arredondadas, sem biblioteca de icones.
// Sao decorativos por padrao (aria-hidden); quem usa o icone sozinho precisa dar um aria-label ao botao.

interface PropsDeIcone extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  tamanho?: number
  espessura?: number
}

function Base({ tamanho = 20, espessura = 2, children, ...resto }: PropsDeIcone) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamanho}
      height={tamanho}
      fill="none"
      stroke="currentColor"
      strokeWidth={espessura}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...resto}
    >
      {children}
    </svg>
  )
}

// garfo e faca do logo (traco branco 2, sobre o circulo de marca)
export function IconeGarfoFaca(props: PropsDeIcone) {
  return (
    <Base {...props}>
      <path d="M7 3v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3M4 11v10M7 3v7M5.5 3v5" />
      <path d="M17 3c-1.7 0-3 2.1-3 5.5S15.3 14 17 14s3-2.1 3-5.5S18.7 3 17 3z" />
      <path d="M17 14v7" />
    </Base>
  )
}

// espessura 3 a 4 conforme o tamanho
export function IconeCheck({ espessura = 3, ...props }: PropsDeIcone) {
  return (
    <Base espessura={espessura} {...props}>
      <path d="M5 12l5 5 9-10" />
    </Base>
  )
}

export function IconeVoltar({ espessura = 2.5, ...props }: PropsDeIcone) {
  return (
    <Base espessura={espessura} {...props}>
      <path d="M15 6l-6 6 6 6" />
    </Base>
  )
}

export function IconeWhatsApp(props: PropsDeIcone) {
  return (
    <Base {...props}>
      <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.6-5.2A8.5 8.5 0 1 1 21 11.5z" />
    </Base>
  )
}

export function IconeFiltro(props: PropsDeIcone) {
  return (
    <Base {...props}>
      <path d="M4 6h16M7 12h10M10 18h4" />
    </Base>
  )
}

// mostrar senha
export function IconeOlho(props: PropsDeIcone) {
  return (
    <Base {...props}>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </Base>
  )
}

// ocultar senha
export function IconeOlhoRiscado(props: PropsDeIcone) {
  return (
    <Base {...props}>
      <path d="M2 12s3.6-7 10-7c2 0 3.8.7 5.3 1.7M22 12s-3.6 7-10 7c-2 0-3.8-.7-5.3-1.7" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" />
    </Base>
  )
}
