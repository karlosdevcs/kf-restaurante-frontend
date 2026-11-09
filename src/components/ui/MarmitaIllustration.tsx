// Ilustracao da marmita do painel do produto no computador (spec, seção 6): 220x154, viewBox 200x140.
// E um PLACEHOLDER ate existirem fotos reais; fica isolada neste componente para trocar sem mexer nas telas.
export function MarmitaIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" width={220} height={154} className={className} aria-hidden="true" focusable="false">
      <rect x="8" y="10" width="184" height="120" rx="20" fill="#FFFFFF" stroke="#16181D" strokeWidth="3" />
      <path d="M100 14v112M100 70h88" stroke="#16181D" strokeWidth="2.5" />
      <rect x="16" y="18" width="80" height="104" rx="12" fill="#FBF2E4" />
      <path d="M30 40l8 4M54 36l8 3M38 62l8 3M62 58l8 4M30 86l8 3M52 82l8 4M70 100l8 3M36 106l8 3" stroke="#D8BE8E" strokeWidth="4" strokeLinecap="round" />
      <circle cx="122" cy="36" r="8" fill="#B0552B" />
      <circle cx="144" cy="46" r="8" fill="#B0552B" />
      <circle cx="166" cy="34" r="8" fill="#B0552B" />
      <circle cx="132" cy="56" r="6" fill="#B0552B" />
      <circle cx="170" cy="54" r="6" fill="#B0552B" />
      <path d="M112 116c-6-18 12-32 34-28 20 4 34 18 26 30-9 10-48 12-60-2z" fill="#E4A94A" stroke="#16181D" strokeWidth="3" />
    </svg>
  )
}
