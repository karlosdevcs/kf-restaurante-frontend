import { Fragment, useCallback, useEffect, useState } from 'react'
import { buscarPedido, listarPedidos } from '../api'
import { BotaoSecundario, Carregando, ErroInline } from '../components/Feedback'
import { Pill } from '../components/Pill'
import { NOME_FORMA_PAGAMENTO } from '../types/api'
import type { Pedido, PedidoResumo } from '../types/api'
import { formatarHora, formatarMoeda, formatarTelefone, mensagemDeErro } from '../utils/formatar'

type Filtro = 'Todos' | 'Enviado' | 'Gerado'

const INTERVALO_ATUALIZACAO_MS = 45_000

function StatusBadge({ status }: { status: PedidoResumo['status'] }) {
  return status === 'Enviado' ? (
    <span className="rounded-full bg-sucesso-bg px-3 py-1 text-xs font-bold text-sucesso">Enviado</span>
  ) : (
    <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">Não enviado</span>
  )
}

// A loja chama o cliente quando ele gerou o pedido mas nao mandou no WhatsApp.
// (wa.me precisa do codigo do pais; o telefone do pedido vem so com DDD)
function ChamarNoWhatsApp({ pedido }: { pedido: PedidoResumo }) {
  if (pedido.status !== 'Gerado' || pedido.telefone === '') return null

  const mensagem = `Olá, ${pedido.nomeCliente}! Aqui é do KF Restaurante. Vi que você gerou o pedido nº ${pedido.numero}, mas ele não chegou pra gente. Quer confirmar?`
  const link = `https://wa.me/55${pedido.telefone}?text=${encodeURIComponent(mensagem)}`

  return (
    <a href={link} target="_blank" rel="noopener noreferrer" className="inline-block rounded-full bg-sucesso px-4 py-2 text-sm font-bold text-white hover:opacity-90">
      Chamar no WhatsApp
    </a>
  )
}

// itens e demais detalhes nao vem na lista (de proposito); so buscamos quando a loja abre o pedido
function Detalhes({ id }: { id: number }) {
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    buscarPedido(id).then(setPedido).catch((e) => setErro(mensagemDeErro(e)))
  }, [id])

  if (erro) return <ErroInline mensagem={erro} />
  if (!pedido) return <p className="text-sm text-texto-terciario">Carregando itens...</p>

  return (
    <div className="space-y-3 text-sm">
      <ul className="space-y-1">
        {pedido.itens.map((item, i) => (
          <li key={i}>
            <span className="font-semibold">
              {item.quantidade}x {item.nome}
            </span>
            {item.componentes && <span className="text-texto-secundario"> — {item.componentes}</span>}
          </li>
        ))}
      </ul>
      <p className="text-texto-secundario">
        {pedido.tipoDeEntrega === 'Entrega' ? `Entrega: ${pedido.endereco}` : 'Retirada no local'}
        {pedido.referencia && ` · Ref.: ${pedido.referencia}`}
      </p>
      <p className="text-texto-secundario">
        {NOME_FORMA_PAGAMENTO[pedido.formaDePagamento]}
        {pedido.formaDePagamento === 'Dinheiro' && (pedido.trocoPara ? ` · troco para ${formatarMoeda(pedido.trocoPara)}` : ' · sem troco')}
      </p>
      {pedido.observacao && <p className="font-semibold">Obs.: {pedido.observacao}</p>}
    </div>
  )
}

export function PedidosTab() {
  const [pedidos, setPedidos] = useState<PedidoResumo[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('Todos')
  const [aberto, setAberto] = useState<number | null>(null)
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null)

  const carregar = useCallback(async () => {
    try {
      // sem data: o backend assume hoje no fuso de Brasilia
      setPedidos(await listarPedidos())
      setAtualizadoEm(new Date())
      setErro(null)
    } catch (e) {
      setErro(mensagemDeErro(e))
    }
  }, [])

  // polling simples (sem WebSocket nesta versao)
  useEffect(() => {
    void carregar()
    const timer = setInterval(() => void carregar(), INTERVALO_ATUALIZACAO_MS)
    return () => clearInterval(timer)
  }, [carregar])

  if (!pedidos && !erro) return <Carregando texto="Carregando pedidos..." />

  const lista = pedidos ?? []
  const contagem = {
    Todos: lista.length,
    Enviado: lista.filter((p) => p.status === 'Enviado').length,
    Gerado: lista.filter((p) => p.status === 'Gerado').length,
  }
  const visiveis = filtro === 'Todos' ? lista : lista.filter((p) => p.status === filtro)
  const alternar = (id: number) => setAberto((atual) => (atual === id ? null : id))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Pill ativo={filtro === 'Todos'} onClick={() => setFiltro('Todos')}>
            Todos ({contagem.Todos})
          </Pill>
          <Pill ativo={filtro === 'Enviado'} onClick={() => setFiltro('Enviado')}>
            Enviado ({contagem.Enviado})
          </Pill>
          <Pill ativo={filtro === 'Gerado'} onClick={() => setFiltro('Gerado')}>
            Não enviado ({contagem.Gerado})
          </Pill>
        </div>
        <div className="flex items-center gap-3">
          {atualizadoEm && <span className="text-xs text-texto-terciario">Atualizado às {atualizadoEm.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>}
          <BotaoSecundario onClick={() => void carregar()}>Atualizar</BotaoSecundario>
        </div>
      </div>

      <ErroInline mensagem={erro} />

      {visiveis.length === 0 ? (
        <p className="py-12 text-center text-texto-secundario">Nenhum pedido {filtro === 'Todos' ? 'hoje' : 'neste filtro'}.</p>
      ) : (
        <>
          {/* desktop: tabela */}
          <table className="hidden w-full text-left md:table">
            <thead>
              <tr className="border-b border-borda-media text-xs uppercase tracking-wide text-texto-terciario">
                <th className="py-2 font-semibold">Pedido</th>
                <th className="py-2 font-semibold">Cliente</th>
                <th className="py-2 font-semibold">Pagamento</th>
                <th className="py-2 text-right font-semibold">Total</th>
                <th className="py-2 pl-6 font-semibold">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visiveis.map((p) => (
                <Fragment key={p.id}>
                  <tr className="border-b border-borda-leve align-top">
                    <td className="py-3">
                      <p className="font-bold">nº {p.numero}</p>
                      <p className="text-xs text-texto-terciario">{formatarHora(p.horaPedido)}</p>
                    </td>
                    <td className="py-3">
                      <p className="font-semibold">{p.nomeCliente}</p>
                      <p className="text-xs text-texto-terciario">{p.telefone ? formatarTelefone(p.telefone) : 'sem telefone'}</p>
                    </td>
                    <td className="py-3 text-sm text-texto-secundario">
                      {NOME_FORMA_PAGAMENTO[p.formaDePagamento]} · {p.tipoDeEntrega === 'Entrega' ? 'Entrega' : 'Retirada'}
                    </td>
                    <td className="py-3 text-right font-bold">{formatarMoeda(p.total)}</td>
                    <td className="py-3 pl-6 space-y-2">
                      <StatusBadge status={p.status} />
                      <div>
                        <ChamarNoWhatsApp pedido={p} />
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <button type="button" onClick={() => alternar(p.id)} className="text-sm font-semibold text-texto-secundario hover:text-texto-principal">
                        {aberto === p.id ? 'Ocultar' : 'Ver itens'}
                      </button>
                    </td>
                  </tr>
                  {aberto === p.id && (
                    <tr className="border-b border-borda-leve bg-loja-bg/60">
                      <td colSpan={6} className="px-4 py-4">
                        <Detalhes id={p.id} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>

          {/* mobile: cartoes */}
          <ul className="space-y-3 md:hidden">
            {visiveis.map((p) => (
              <li key={p.id} className="rounded-lg border border-borda-leve p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">
                      nº {p.numero} · {p.nomeCliente}
                    </p>
                    <p className="text-xs text-texto-terciario">
                      {formatarHora(p.horaPedido)} · {p.telefone ? formatarTelefone(p.telefone) : 'sem telefone'}
                    </p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <p className="mt-2 text-sm text-texto-secundario">
                  {NOME_FORMA_PAGAMENTO[p.formaDePagamento]} · {p.tipoDeEntrega === 'Entrega' ? 'Entrega' : 'Retirada'} · <strong className="text-texto-principal">{formatarMoeda(p.total)}</strong>
                </p>
                {p.status === 'Gerado' && <p className="mt-2 text-xs font-semibold text-brand">O cliente ainda não enviou no WhatsApp.</p>}
                <div className="mt-3 flex items-center justify-between">
                  <ChamarNoWhatsApp pedido={p} />
                  <button type="button" onClick={() => alternar(p.id)} className="ml-auto text-sm font-semibold text-texto-secundario">
                    {aberto === p.id ? 'Ocultar' : 'Ver itens'}
                  </button>
                </div>
                {aberto === p.id && (
                  <div className="mt-3 border-t border-borda-leve pt-3">
                    <Detalhes id={p.id} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
