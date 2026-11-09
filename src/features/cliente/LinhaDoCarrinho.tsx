import { LineStepper } from '../../components/ui'
import { nomeDoItem, subtotalDoItem, type ItemDoCarrinho } from '../../lib/carrinho'
import { cx } from '../../lib/cx'
import { formatBRL } from '../../lib/formatar'

interface PropsDaLinha {
  item: ItemDoCarrinho
  /** ingredientes da marmita, ja formatados em uma linha */
  detalhe: string
  /** depois de uma atualizacao automatica, um componente da linha acabou */
  esgotado: boolean
  /** celular: subtotal a direita; computador: "R$ x,xx cada" embaixo */
  tamanho: 'celular' | 'desktop'
  aoMudarQuantidade: (quantidade: number) => void
}

// Linha do carrinho (spec, 9.2 e 9.3): fundo surface, raio 16, padding 10, gap 12, quadrado de 40 (celular) ou 44 (computador).
export function LinhaDoCarrinho({ item, detalhe, esgotado, tamanho, aoMudarQuantidade }: PropsDaLinha) {
  const celular = tamanho === 'celular'
  const nome = nomeDoItem(item)

  return (
    <li className="flex flex-col gap-2 rounded-cartao bg-surface p-[10px]">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className={cx('shrink-0 bg-cat-carne', celular ? 'h-10 w-10 rounded-tamanho' : 'h-11 w-11 rounded-escolha')} />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold">
            {item.quantidade}x {nome}
          </p>
          {detalhe ? <p className="truncate text-[12px] text-muted">{detalhe}</p> : null}
          <p className="text-[13px] font-bold text-brand">{celular ? formatBRL(subtotalDoItem(item)) : `${formatBRL(item.precoUnitario)} cada`}</p>
        </div>
        <LineStepper valor={item.quantidade} aoMudar={aoMudarQuantidade} nomeDoItem={nome} tamanho={celular ? 'celular' : 'desktop'} />
      </div>
      {esgotado ? <p className="text-[12px] font-semibold text-brand-strong">Este item acabou. Remova para continuar.</p> : null}
    </li>
  )
}
