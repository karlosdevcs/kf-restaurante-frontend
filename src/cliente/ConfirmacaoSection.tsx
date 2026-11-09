import { marcarComoEnviado } from '../api'
import { BotaoPrincipal } from '../components/Feedback'
import type { Pedido } from '../types/api'

interface Props {
  pedido: Pedido
  onNovoPedido: () => void
}

export function ConfirmacaoSection({ pedido, onNovoPedido }: Props) {
  function enviarNoWhatsApp() {
    if (!pedido.linkWhatsApp) return

    // Avisa a API sem travar o fluxo: se falhar, o cliente ainda precisa conseguir mandar o pedido.
    marcarComoEnviado(pedido.id).catch(() => undefined)

    // o link wa.me ja vem pronto da API, com o numero da loja e a mensagem codificada
    window.open(pedido.linkWhatsApp, '_blank', 'noopener')
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 py-4 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sucesso-bg text-sucesso">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12l5 5L20 7" />
        </svg>
      </div>

      <div>
        <p className="text-sm font-semibold text-texto-terciario">Pedido gerado</p>
        <h1 className="text-4xl font-extrabold tracking-tight">nº {pedido.numero}</h1>
      </div>

      <p className="text-texto-secundario">
        Falta só um passo: <strong className="text-texto-principal">envie o pedido no WhatsApp da loja</strong> para ele começar a ser preparado.
      </p>

      <pre className="whitespace-pre-wrap rounded-lg bg-loja-bg p-4 text-left font-sans text-sm leading-relaxed">{pedido.mensagemWhatsApp}</pre>

      {pedido.linkWhatsApp ? (
        <BotaoPrincipal onClick={enviarNoWhatsApp}>Enviar no WhatsApp</BotaoPrincipal>
      ) : (
        <p role="alert" className="rounded-sm border border-brand/30 bg-brand/5 px-4 py-3 text-sm font-medium text-brand-hover">
          A loja ainda não cadastrou o WhatsApp. Copie a mensagem acima e envie diretamente.
        </p>
      )}

      <button type="button" onClick={onNovoPedido} className="text-sm font-semibold text-texto-secundario hover:text-texto-principal">
        Fazer outro pedido
      </button>
    </div>
  )
}
