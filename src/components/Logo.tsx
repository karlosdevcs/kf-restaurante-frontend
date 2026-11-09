interface Props {
  tamanho?: number
}

// circulo vermelho com garfo e faca (SVG inline) + "KF Restaurante"
export function Logo({ tamanho = 32 }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="flex shrink-0 items-center justify-center rounded-full bg-brand"
        style={{ width: tamanho, height: tamanho }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" width={tamanho * 0.55} height={tamanho * 0.55} fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          {/* garfo */}
          <path d="M7 3v7" />
          <path d="M5 3v4a2 2 0 0 0 4 0V3" />
          <path d="M7 10v11" />
          {/* faca */}
          <path d="M17 21V3c-2 1.5-3 4-3 7v3h3" />
        </svg>
      </span>
      <span className="text-lg font-extrabold tracking-tight">
        <span className="text-texto-principal">KF</span> <span className="text-brand">Restaurante</span>
      </span>
    </div>
  )
}
