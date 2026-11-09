import type { ReactNode } from 'react'
import { Button } from '../../components/ui'
import { cx } from '../../lib/cx'
import { TEXTO_DO_BLOQUEIO, type MotivoDoBloqueio } from './useDadosDoCliente'

// Bloco de carregamento (spec, 14): `canvas` no formato do conteudo, sem spinner global.
export function Esqueleto({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cx('animate-pulse rounded-cartao bg-canvas', className)} />
}

// Cartao centralizado para os estados vazio e de erro (spec, 14)
export function CartaoDeEstado({ titulo, texto, acao, papel = 'status' }: { titulo: string; texto?: string; acao?: ReactNode; papel?: 'status' | 'alert' }) {
  return (
    <div role={papel} className="mx-auto my-6 flex max-w-[420px] flex-col items-center gap-3 rounded-cartao border border-line-soft bg-white p-6 text-center">
      <h2 className="text-[18px] font-bold">{titulo}</h2>
      {texto ? <p className="text-[14px] text-muted">{texto}</p> : null}
      {acao}
    </div>
  )
}

export function CartaoSemCardapio() {
  return <CartaoDeEstado titulo="A loja ainda não publicou o cardápio de hoje" texto="Volte em alguns minutos." />
}

export function CartaoDeErroDeCarga({ aoTentarDeNovo }: { aoTentarDeNovo: () => void }) {
  return (
    <CartaoDeEstado
      papel="alert"
      titulo="Não foi possível carregar"
      acao={
        <Button variante="outline" onClick={aoTentarDeNovo}>
          Tentar de novo
        </Button>
      }
    />
  )
}

// Faixa abaixo do cabecalho quando a loja esta fechada ou o cardapio foi encerrado (spec, 14)
export function FaixaDeBloqueio({ motivo }: { motivo: MotivoDoBloqueio }) {
  return (
    <div role="status" className="bg-brand-tint px-5 py-[10px] text-[14px] font-semibold text-brand-strong">
      {TEXTO_DO_BLOQUEIO[motivo]}
    </div>
  )
}
