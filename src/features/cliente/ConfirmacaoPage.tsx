import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { marcarComoEnviado } from '../../api/pedidos'
import { Button, IconeCheck, LinkButton } from '../../components/ui'
import { cx } from '../../lib/cx'
import { useFocoNoTitulo } from '../../lib/useFocoNoTitulo'
import { useIsDesktop } from '../../lib/useIsDesktop'
import { useCliente } from './useCliente'

// Tela 4: Confirmacao (spec, 9.3 e 12.4). Os dados vem da resposta do POST /pedidos: GET /pedidos/{id} exige login,
// entao esta tela nao consegue recarregar o pedido pela API. A mensagem aparece EXATAMENTE como a API devolveu.
export function ConfirmacaoPage() {
  const { numero } = useParams()
  const navegar = useNavigate()
  const desktop = useIsDesktop()
  const { pedidoConfirmado: pedido, recomecar } = useCliente()
  const titulo = useFocoNoTitulo()

  // aberta sem o dado do pedido (ou de outro pedido): nao ha o que mostrar
  if (!pedido || String(pedido.numero) !== numero) return <Navigate to="/" replace />

  function aoEnviarNoWhatsApp() {
    // sem esperar e sem impedir o link de abrir: a chamada e aberta e idempotente; falha e silenciosa para o cliente
    if (!pedido) return
    marcarComoEnviado(pedido.id).catch((erro: unknown) => {
      if (import.meta.env.DEV) console.warn('Não foi possível avisar que o pedido foi enviado.', erro)
    })
  }

  function fazerOutroPedido() {
    recomecar()
    navegar('/', { replace: true })
  }

  const botoes = (
    <div className="flex flex-col gap-2">
      {pedido.linkWhatsApp ? (
        <LinkButton href={pedido.linkWhatsApp} target="_blank" rel="noopener noreferrer" variante="whatsapp" altura={52} larguraTotal onClick={aoEnviarNoWhatsApp}>
          Enviar no WhatsApp
        </LinkButton>
      ) : (
        <>
          <Button variante="whatsapp" altura={52} larguraTotal disabled>
            Enviar no WhatsApp
          </Button>
          <p role="status" className="text-center text-[13px] text-muted">
            A loja ainda não cadastrou o WhatsApp. Avise a loja pelo telefone.
          </p>
        </>
      )}
      <button type="button" onClick={fazerOutroPedido} className="toque-v h-[46px] text-[14px] font-bold text-brand" style={{ '--h': '46px' } as React.CSSProperties}>
        Fazer outro pedido
      </button>
    </div>
  )

  return (
    <div className={cx('flex min-h-dvh flex-col bg-white', desktop && 'items-center')}>
      <main className="flex w-full max-w-[680px] flex-1 flex-col gap-[18px] px-5 pt-8 pb-5">
        <span aria-hidden="true" className="grid h-14 w-14 place-items-center rounded-full bg-success-bg text-success">
          <IconeCheck tamanho={28} espessura={3} />
        </span>
        <h1 ref={titulo} tabIndex={-1} className="text-[26px] font-extrabold">
          Pedido nº {pedido.numero} registrado
        </h1>
        <p className="text-[14px] leading-normal text-muted">Agora é só enviar pro WhatsApp da loja. Ela confirma por lá.</p>
        {/* texto puro (nunca HTML), com as quebras de linha da API */}
        <div className="rounded-cartao bg-surface p-4 text-[14px] leading-normal whitespace-pre-line">{pedido.mensagemWhatsApp}</div>
        {desktop ? botoes : null}
      </main>
      {!desktop ? <footer className="sticky bottom-0 w-full bg-white px-5 pt-3 pb-[18px]">{botoes}</footer> : null}
    </div>
  )
}
