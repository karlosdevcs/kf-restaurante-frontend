import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Chip } from '../../components/ui'
import { cx } from '../../lib/cx'
import { iniciais } from '../../lib/formatar'
import { rotuloDoPapel } from '../../lib/permissoes'
import { useIsDesktop } from '../../lib/useIsDesktop'
import { useSessao } from '../auth/useSessao'

// Menu do usuario no cabecalho da loja (spec, componentes): circulo com as iniciais; abre um cartao com nome, e-mail,
// papel, "Minha conta" e "Sair". Fecha com Esc e clique fora. No celular o mesmo conteudo abre como folha de rodape.
export function UserMenu() {
  const { usuario, sair } = useSessao()
  const navegar = useNavigate()
  const desktop = useIsDesktop()
  const [aberto, setAberto] = useState(false)
  const raiz = useRef<HTMLDivElement>(null)
  const gatilho = useRef<HTMLButtonElement>(null)
  const idDoCartao = useId()

  useEffect(() => {
    if (!aberto) return

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        setAberto(false)
        gatilho.current?.focus()
      }
    }
    function aoClicarFora(evento: MouseEvent) {
      if (raiz.current && !raiz.current.contains(evento.target as Node)) setAberto(false)
    }

    document.addEventListener('keydown', aoTeclar)
    document.addEventListener('mousedown', aoClicarFora)
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.removeEventListener('mousedown', aoClicarFora)
    }
  }, [aberto])

  if (!usuario) return null

  const item = 'flex min-h-[44px] w-full items-center rounded-escolha px-3 text-left text-[14px] font-semibold text-ink hover:bg-surface'

  const cartao = (
    <div
      id={idDoCartao}
      role="group"
      aria-label="Menu da conta"
      className={cx(
        'bg-white p-2',
        desktop ? 'absolute right-0 top-[calc(100%+8px)] z-40 min-w-[220px] rounded-cartao border border-line-soft shadow-cartao' : 'w-full rounded-t-dialogo p-4',
      )}
    >
      <div className="flex flex-col gap-1 px-3 py-2">
        <span className="text-[14px] font-bold">{usuario.nome}</span>
        <span className="text-[12px] text-muted">{usuario.email}</span>
        <span className="pt-1">
          <Chip variante={usuario.papel === 'Superuser' ? 'superuser' : 'papel'}>{rotuloDoPapel(usuario.papel)}</Chip>
        </span>
      </div>
      <hr className="my-1 border-line-soft" />
      <button
        type="button"
        className={item}
        onClick={() => {
          setAberto(false)
          navegar('/loja/conta')
        }}
      >
        Minha conta
      </button>
      <button
        type="button"
        className={item}
        onClick={() => {
          setAberto(false)
          sair()
        }}
      >
        Sair
      </button>
    </div>
  )

  return (
    <div ref={raiz} className="relative">
      <button
        ref={gatilho}
        type="button"
        aria-haspopup="true"
        aria-expanded={aberto}
        aria-controls={aberto ? idDoCartao : undefined}
        aria-label={`Conta de ${usuario.nome}`}
        onClick={() => setAberto((v) => !v)}
        className="flex items-center gap-2"
      >
        <span
          aria-hidden="true"
          className="toque-q grid h-[34px] w-[34px] place-items-center rounded-full bg-canvas text-[13px] font-bold text-ink"
          style={{ '--lado': '34px' } as React.CSSProperties}
        >
          {iniciais(usuario.nome)}
        </span>
        {desktop ? <span className="text-[14px] font-semibold">{usuario.nome}</span> : null}
      </button>
      {aberto ? (desktop ? cartao : <div className="fixed inset-0 z-50 flex items-end bg-overlay">{cartao}</div>) : null}
    </div>
  )
}
