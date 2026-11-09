import { LinkButton, OrderStatusPill } from '../../../components/ui'
import type { PedidoResumo } from '../../../api/tipos'
import { cx } from '../../../lib/cx'
import { formatBRL, formatHora, formatTelefone } from '../../../lib/formatar'
import { linhaDeEntregaEPagamento, linkParaChamarOCliente, resumoDosItens } from '../../../lib/pedidoLoja'
import { contarPorStatus, type FiltroDeStatus } from '../../../lib/statusPedido'
import { Esqueleto } from '../../cliente/Estados'
import { usePedidoDetalhe } from './usePedidos'

// ---------- filtros ----------

const FILTROS: Array<{ id: FiltroDeStatus; rotulo: string; rotuloCurto: string }> = [
  { id: 'todos', rotulo: 'Todos', rotuloCurto: 'Todos' },
  { id: 'enviado', rotulo: 'Enviados', rotuloCurto: 'Enviados' },
  { id: 'naoEnviado', rotulo: 'Não enviados', rotuloCurto: 'Não env.' },
]

// Cartoes de filtro com contagem (spec, 11.1). A contagem vem SEMPRE da lista completa do dia; o filtro e aplicado no cliente.
export function FiltrosDePedidos({
  pedidos,
  ativo,
  aoEscolher,
  celular,
}: {
  pedidos: PedidoResumo[]
  ativo: FiltroDeStatus
  aoEscolher: (filtro: FiltroDeStatus) => void
  celular: boolean
}) {
  const contagem = contarPorStatus(pedidos)

  return (
    <div role="group" aria-label="Filtrar pedidos" className={cx(celular ? 'grid grid-cols-3 gap-2' : 'flex flex-wrap gap-[10px]')}>
      {FILTROS.map((filtro) => {
        const selecionado = ativo === filtro.id
        return (
          <button
            key={filtro.id}
            type="button"
            aria-pressed={selecionado}
            onClick={() => aoEscolher(filtro.id)}
            className={cx(
              'flex flex-col items-start rounded-escolha border text-left',
              celular ? 'bg-surface px-[10px] pt-[10px] pb-2' : 'min-w-[110px] bg-white px-[14px] py-[10px]',
              selecionado ? 'border-brand' : 'border-line-soft',
            )}
          >
            <span className={cx('text-[22px] leading-tight font-extrabold', selecionado ? 'text-brand-strong' : 'text-ink')}>{contagem[filtro.id]}</span>
            <span className={cx('text-muted', celular ? 'text-[11px]' : 'text-[12px]')}>{celular ? filtro.rotuloCurto : filtro.rotulo}</span>
          </button>
        )
      })}
    </div>
  )
}

// ---------- detalhe sob demanda ----------

// Itens, referencia e observacao vem do detalhe (o resumo da lista nao os traz): esqueleto de uma linha enquanto carrega.
export function ItensDoPedido({ id, className }: { id: number; className?: string }) {
  const detalhe = usePedidoDetalhe(id)

  if (detalhe.isPending) return <Esqueleto className={cx('h-4 w-48 rounded-tamanho', className)} />
  if (detalhe.isError) {
    return (
      <button type="button" onClick={() => void detalhe.refetch()} className="inline-flex min-h-[44px] items-center text-[12px] font-semibold text-brand">
        Não foi possível carregar os itens. Tentar de novo
      </button>
    )
  }
  return <span className={className}>{resumoDosItens(detalhe.data.itens)}</span>
}

export function LinhaDeEntrega({ resumo, className }: { resumo: PedidoResumo; className?: string }) {
  const detalhe = usePedidoDetalhe(resumo.id)
  return <span className={className}>{linhaDeEntregaEPagamento(resumo, detalhe.data)}</span>
}

export function ReferenciaEObservacao({ id }: { id: number }) {
  const detalhe = usePedidoDetalhe(id)
  if (!detalhe.data) return null

  return (
    <>
      {detalhe.data.referencia ? <p className="text-[12px] text-muted">Ref.: {detalhe.data.referencia}</p> : null}
      {detalhe.data.observacao ? <p className="text-[12px] text-muted">Obs.: {detalhe.data.observacao}</p> : null}
    </>
  )
}

// ---------- acao ----------

// "Chamar no WhatsApp": so para pedido nao enviado. Abre wa.me/55{telefone} em nova aba com a mensagem padrao.
export function ChamarNoWhatsApp({ pedido, celular }: { pedido: PedidoResumo; celular: boolean }) {
  return (
    <LinkButton
      href={linkParaChamarOCliente(pedido)}
      target="_blank"
      rel="noopener noreferrer"
      variante="outline-brand"
      altura={celular ? 40 : 34}
      className={cx('px-3 font-bold', celular ? 'text-[13px]' : 'mt-2 text-[12px]')}
      aria-label={`Chamar ${pedido.nomeCliente} no WhatsApp, pedido ${pedido.numero}`}
    >
      Chamar no WhatsApp
    </LinkButton>
  )
}

// ---------- computador: tabela ----------

export function TabelaDePedidos({ pedidos }: { pedidos: PedidoResumo[] }) {
  const cabecalho = 'px-4 py-3 text-left text-[12px] font-normal tracking-[0.5px] text-muted uppercase'

  return (
    <div className="overflow-x-auto rounded-cartao border border-line-soft bg-white">
      <table className="w-full min-w-[680px] border-collapse">
        <thead>
          <tr className="border-b border-line-soft">
            <th scope="col" className={cabecalho}>
              Pedido
            </th>
            <th scope="col" className={cabecalho}>
              Cliente
            </th>
            <th scope="col" className={cabecalho}>
              Itens
            </th>
            <th scope="col" className={cx(cabecalho, 'text-right')}>
              Total
            </th>
            <th scope="col" className={cabecalho}>
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((pedido) => {
            const naoEnviado = pedido.status === 'Gerado'
            return (
              <tr key={pedido.id} className={cx('border-b border-line-row align-top last:border-b-0', naoEnviado && 'bg-warn-row')}>
                <td className="px-4 py-[14px]">
                  <p className="font-bold">Nº {pedido.numero}</p>
                  <p className="text-[12px] text-muted">{formatHora(pedido.horaPedido)}</p>
                </td>
                <td className="px-4 py-[14px]">
                  <p className="font-semibold">{pedido.nomeCliente}</p>
                  <p className="text-[12px] text-muted">{formatTelefone(pedido.telefone)}</p>
                </td>
                <td className="px-4 py-[14px] text-[14px]">
                  <p>
                    <ItensDoPedido id={pedido.id} />
                  </p>
                  <p>
                    <LinhaDeEntrega resumo={pedido} className="text-[12px] text-muted" />
                  </p>
                  <ReferenciaEObservacao id={pedido.id} />
                </td>
                <td className="px-4 py-[14px] text-right font-bold whitespace-nowrap text-brand">{formatBRL(pedido.total)}</td>
                <td className="px-4 py-[14px]">
                  <OrderStatusPill status={pedido.status} />
                  {naoEnviado ? <div><ChamarNoWhatsApp pedido={pedido} celular={false} /></div> : null}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ---------- celular: um cartao por pedido ----------

export function CartoesDePedidos({ pedidos }: { pedidos: PedidoResumo[] }) {
  return (
    <ul className="flex flex-col gap-[10px]">
      {pedidos.map((pedido) => (
        <li key={pedido.id} className="flex flex-col gap-2 rounded-cartao border border-ink bg-white p-[14px]">
          <div className="flex items-center justify-between">
            <p>
              <span className="text-[16px] font-bold">Nº {pedido.numero}</span> <span className="text-[12px] text-muted">{formatHora(pedido.horaPedido)}</span>
            </p>
            <OrderStatusPill status={pedido.status} />
          </div>
          <p>
            <span className="text-[14px] font-semibold">{pedido.nomeCliente}</span> <span className="text-[12px] text-muted">{formatTelefone(pedido.telefone)}</span>
          </p>
          <p className="text-[13px] leading-[1.4]">
            <ItensDoPedido id={pedido.id} />
          </p>
          <ReferenciaEObservacao id={pedido.id} />
          <div className="flex items-center justify-between gap-3 border-t border-line pt-2">
            <LinhaDeEntrega resumo={pedido} className="text-[12px] text-muted" />
            <span className="text-[16px] font-extrabold whitespace-nowrap text-brand">{formatBRL(pedido.total)}</span>
          </div>
          {pedido.status === 'Gerado' ? <ChamarNoWhatsApp pedido={pedido} celular /> : null}
        </li>
      ))}
    </ul>
  )
}
