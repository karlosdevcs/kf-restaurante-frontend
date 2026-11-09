import { cx } from '../../lib/cx'
import { IconeGarfoFaca } from './icones'

interface PropsDoLogo {
  /** computador: circulo 34, gap 10; celular: circulo 28, gap 8 */
  tamanho?: 'desktop' | 'celular'
  /** o texto e um pouco menor no cabecalho da loja (18 e 15) que no do cliente (19 e 16) */
  contexto?: 'cliente' | 'loja'
  /** loja no computador: acrescenta "Painel da loja" a direita, separado por uma borda */
  comPainel?: boolean
}

// Circulo de marca com garfo e faca + "KF" em ink e "Restaurante" em brand, colados, mesmo peso (spec, seção 8)
export function Logo({ tamanho = 'desktop', contexto = 'cliente', comPainel = false }: PropsDoLogo) {
  const desktop = tamanho === 'desktop'
  const textoPx = desktop ? (contexto === 'loja' ? 18 : 19) : contexto === 'loja' ? 15 : 16

  return (
    <div className={cx('flex items-center', desktop ? 'gap-[10px]' : 'gap-2')}>
      <span
        className="bg-brand grid shrink-0 place-items-center rounded-full text-white"
        style={{ width: desktop ? 34 : 28, height: desktop ? 34 : 28 }}
      >
        <IconeGarfoFaca tamanho={desktop ? 17 : 14} />
      </span>
      <span className="font-extrabold whitespace-nowrap" style={{ fontSize: textoPx, letterSpacing: '-0.3px' }}>
        <span className="text-ink">KF</span>
        <span className="text-brand">Restaurante</span>
      </span>
      {comPainel && desktop ? <span className="text-muted border-line-soft ml-1 border-l pl-2 text-[13px]">Painel da loja</span> : null}
    </div>
  )
}
