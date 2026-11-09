import { useEffect, useRef, useState } from 'react'
import type { PedidoResumo } from '../../../api/tipos'
import { cx } from '../../../lib/cx'
import { filtrarPorStatus, type FiltroDeStatus } from '../../../lib/statusPedido'
import { useFocoNoTitulo } from '../../../lib/useFocoNoTitulo'
import { useIsDesktop } from '../../../lib/useIsDesktop'
import { Pode } from '../../auth/Pode'
import { CartaoDeErroDeCarga, Esqueleto } from '../../cliente/Estados'
import { AcabouAlgumaCoisa } from '../AcabouAlgumaCoisa'
import { CartoesDePedidos, FiltrosDePedidos, TabelaDePedidos } from './ComponentesDePedido'
import { usePedidosDeHoje } from './usePedidos'

// Aba Pedidos (VerPedidos, spec 11.1). Computador: tabela e, so com EsgotarOpcoes, a coluna "Acabou alguma coisa?".
// Celular: um cartao por pedido (a marcacao de esgotado fica na aba Hoje).
export function PedidosPage() {
  const desktop = useIsDesktop()
  const pedidos = usePedidosDeHoje()
  const [filtro, setFiltro] = useState<FiltroDeStatus>('todos')
  const anuncio = useNovosPedidos(pedidos.data)
  const titulo = useFocoNoTitulo()

  const lista = pedidos.data ?? []
  const visiveis = filtrarPorStatus(lista, filtro)

  let corpo
  if (pedidos.isPending) {
    corpo = (
      <div role="status" aria-busy="true" aria-label="Carregando os pedidos" className="flex flex-col gap-2">
        <Esqueleto className="h-16" />
        <Esqueleto className="h-16" />
        <Esqueleto className="h-16" />
      </div>
    )
  } else if (pedidos.isError && pedidos.data === undefined) {
    corpo = <CartaoDeErroDeCarga aoTentarDeNovo={() => void pedidos.refetch()} />
  } else if (lista.length === 0) {
    corpo = <p className="rounded-cartao border border-line-soft bg-white p-6 text-center text-[14px] text-muted">Nenhum pedido ainda hoje.</p>
  } else if (visiveis.length === 0) {
    corpo = <p className="rounded-cartao border border-line-soft bg-white p-6 text-center text-[14px] text-muted">Nenhum pedido nesse filtro.</p>
  } else {
    corpo = desktop ? <TabelaDePedidos pedidos={visiveis} /> : <CartoesDePedidos pedidos={visiveis} />
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 ref={titulo} tabIndex={-1} className={cx('font-extrabold', desktop ? 'text-[24px]' : 'text-[22px]')}>
          Pedidos de hoje
        </h1>
        {desktop ? <p className="text-[13px] text-muted">O mais recente aparece primeiro</p> : null}
      </div>

      {/* pedidos novos sao anunciados para leitor de tela, sem som e sem notificacao */}
      <p role="status" aria-live="polite" className="so-leitor">
        {anuncio}
      </p>

      <FiltrosDePedidos pedidos={lista} ativo={filtro} aoEscolher={setFiltro} celular={!desktop} />

      {desktop ? (
        <div className="flex flex-wrap items-start gap-6">
          <div className="min-w-[600px] flex-[999]">{corpo}</div>
          <Pode permissao="EsgotarOpcoes">
            <div className="min-w-[280px] flex-1">
              <AcabouAlgumaCoisa layout="coluna" />
            </div>
          </Pode>
        </div>
      ) : (
        corpo
      )}
    </div>
  )
}

// Texto "Novo pedido nº X" quando um pedido aparece depois da primeira carga da lista
function useNovosPedidos(pedidos: PedidoResumo[] | undefined): string {
  const conhecidos = useRef<Set<number> | null>(null)
  const [anuncio, setAnuncio] = useState('')

  useEffect(() => {
    if (!pedidos) return

    if (conhecidos.current === null) {
      conhecidos.current = new Set(pedidos.map((pedido) => pedido.id)) // primeira carga: nada e "novo"
      return
    }

    const novos = pedidos.filter((pedido) => !conhecidos.current?.has(pedido.id))
    for (const pedido of pedidos) conhecidos.current.add(pedido.id)
    if (novos.length > 0) setAnuncio(novos.map((pedido) => `Novo pedido nº ${pedido.numero}`).join('. '))
  }, [pedidos])

  return anuncio
}
