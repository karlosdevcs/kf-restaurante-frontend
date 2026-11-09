import { cx } from '../../lib/cx'
import { infoDoStatus } from '../../lib/statusPedido'
import type { StatusPedido } from '../../api/tipos'

// Selo "Aberto" / "Fechado" do cabecalho do cliente (spec, seção 8): 12/700, padding 6 12, raio total.
// A bolinha e um <span> de 8px, nunca o caractere "●".
export function ClientStatusBadge({ aberta }: { aberta: boolean }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-[6px] rounded-pilula px-3 py-[6px] text-[12px] font-bold',
        aberta ? 'bg-success-bg text-success-text' : 'bg-brand-tint text-brand-strong',
      )}
    >
      <span aria-hidden="true" className={cx('h-2 w-2 rounded-full', aberta ? 'bg-success' : 'bg-brand')} />
      {aberta ? 'Aberto' : 'Fechado'}
    </span>
  )
}

// Selo do pedido na loja: "Enviado" (neutro) ou "Não enviado" (aviso). Status novo aparece com o proprio nome.
export function OrderStatusPill({ status }: { status: StatusPedido }) {
  const { rotulo, tom } = infoDoStatus(status)

  return (
    <span
      className={cx(
        'inline-flex items-center rounded-pilula px-[10px] py-1 text-[12px] font-bold whitespace-nowrap',
        tom === 'aviso' ? 'bg-warn-bg text-warn-text' : 'bg-status-neutral-bg text-status-neutral-fg',
      )}
    >
      {rotulo}
    </span>
  )
}
