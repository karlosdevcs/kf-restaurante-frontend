import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../../lib/cx'
import { useIsDesktop } from '../../lib/useIsDesktop'

const FOCAVEIS = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface PropsDoDialog {
  aberto: boolean
  aoFechar: () => void
  titulo: string
  descricao?: ReactNode
  /** conteudo extra entre a descricao e as acoes (ex.: o campo de nova senha) */
  children?: ReactNode
  /** botoes a direita: normalmente `outline` (cancelar) + a acao */
  acoes: ReactNode
}

// Dialogo de confirmacao e de "redefinir senha" (spec, seção 8): sobreposicao `overlay`, cartao branco de raio 20,
// padding 24, largura maxima 400, gap 14. Prende o foco dentro, fecha com Esc e devolve o foco ao botao que abriu.
// No celular ancora no rodape como folha (raio so em cima).
export function Dialog({ aberto, aoFechar, titulo, descricao, children, acoes }: PropsDoDialog) {
  const desktop = useIsDesktop()
  const idDoTitulo = useId()
  const idDaDescricao = useId()
  const cartao = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberto) return

    // guarda quem tinha o foco para devolver ao fechar
    const quemAbriu = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const foco = cartao.current?.querySelector<HTMLElement>(FOCAVEIS)
    ;(foco ?? cartao.current)?.focus()

    return () => quemAbriu?.focus()
  }, [aberto])

  if (!aberto) return null

  function aoTeclar(evento: KeyboardEvent<HTMLDivElement>) {
    if (evento.key === 'Escape') {
      evento.stopPropagation()
      aoFechar()
      return
    }

    if (evento.key !== 'Tab') return

    // prende o foco: Tab no ultimo volta ao primeiro, Shift+Tab no primeiro vai ao ultimo
    const focaveis = Array.from(cartao.current?.querySelectorAll<HTMLElement>(FOCAVEIS) ?? [])
    const primeiro = focaveis[0]
    const ultimo = focaveis[focaveis.length - 1]
    if (!primeiro || !ultimo) {
      evento.preventDefault()
      return
    }

    if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault()
      ultimo.focus()
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault()
      primeiro.focus()
    }
  }

  return createPortal(
    <div className={cx('fixed inset-0 z-50 flex bg-overlay', desktop ? 'items-center justify-center p-4' : 'items-end')}>
      <div
        ref={cartao}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idDoTitulo}
        aria-describedby={descricao ? idDaDescricao : undefined}
        tabIndex={-1}
        onKeyDown={aoTeclar}
        className={cx('flex w-full max-w-[400px] flex-col gap-[14px] bg-white p-6 outline-none', desktop ? 'rounded-dialogo' : 'max-w-none rounded-t-dialogo')}
      >
        <h2 id={idDoTitulo} className="text-[18px] font-extrabold">
          {titulo}
        </h2>
        {descricao ? (
          <p id={idDaDescricao} className="text-[14px] text-muted">
            {descricao}
          </p>
        ) : null}
        {children}
        <div className="flex justify-end gap-2">{acoes}</div>
      </div>
    </div>,
    document.body,
  )
}
