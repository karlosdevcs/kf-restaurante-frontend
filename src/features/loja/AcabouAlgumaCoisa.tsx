import { Link } from 'react-router-dom'
import type { Opcao } from '../../api/tipos'
import { AvailabilityToggle } from '../../components/ui'
import { categoriaInfo } from '../../lib/categoriaConfig'
import { cx } from '../../lib/cx'
import { Pode } from '../auth/Pode'
import { Esqueleto } from '../cliente/Estados'
import { useCardapioDeHoje, useEsgotarOpcao } from './useCardapioDeHoje'

// "Acabou alguma coisa?" (spec, 11.1 e 11.2): lista das opcoes do cardapio de hoje com `AvailabilityToggle`.
// So existe para quem tem `EsgotarOpcoes` (quem usa decide; o toggle tambem e so informativo sem a permissao).
//   coluna : coluna lateral da aba Pedidos no computador (cartao, toggle h34)
//   grade  : aba Hoje no computador (grade auto-fill 230, toggle h36)
//   lista  : aba Hoje no celular (divisorias, toggle h36)
export type LayoutDoAcabou = 'coluna' | 'grade' | 'lista'

export function AcabouAlgumaCoisa({ layout }: { layout: LayoutDoAcabou }) {
  const cardapio = useCardapioDeHoje()
  const esgotar = useEsgotarOpcao()

  const titulo =
    layout === 'coluna' ? (
      <h2 className="text-[16px] font-bold">Acabou alguma coisa?</h2>
    ) : layout === 'grade' ? (
      <h2 className="text-[24px] font-extrabold">Acabou alguma coisa?</h2>
    ) : (
      <h2 className="text-[15px] font-bold">Acabou alguma coisa?</h2>
    )

  const opcoes = cardapio.data?.opcoes ?? []
  const celular = layout === 'lista'

  function item(opcao: Opcao) {
    const nome = (
      <div className="min-w-0 flex-1">
        <p className={cx('text-[14px] font-semibold', opcao.esgotado && 'text-blocked line-through')}>{opcao.nome}</p>
        <p className="text-[12px] text-muted">{categoriaInfo(opcao.categoria).rotulo}</p>
      </div>
    )
    const toggle = (
      <AvailabilityToggle
        nome={opcao.nome}
        esgotado={opcao.esgotado}
        tamanho={celular ? 'celular' : 'web'}
        altura={layout === 'coluna' ? 34 : 36}
        ocupado={esgotar.isPending && esgotar.variables?.id === opcao.id}
        aoAlternar={() => esgotar.mutate({ id: opcao.id, esgotado: !opcao.esgotado })}
      />
    )

    if (layout === 'grade') {
      return (
        <li key={opcao.id} className="flex items-center gap-3 rounded-tile border border-line-soft bg-white px-3 py-[10px]">
          {nome}
          {toggle}
        </li>
      )
    }
    return (
      <li key={opcao.id} className={cx('flex items-center gap-3', celular ? 'border-b border-line-row py-[9px]' : 'py-2')}>
        {nome}
        {toggle}
      </li>
    )
  }

  let corpo
  if (cardapio.isPending) {
    corpo = (
      <div role="status" aria-busy="true" aria-label="Carregando as opções" className="flex flex-col gap-2">
        <Esqueleto className="h-10" />
        <Esqueleto className="h-10" />
        <Esqueleto className="h-10" />
      </div>
    )
  } else if (cardapio.isError) {
    corpo = (
      <div role="alert" className="flex flex-col items-start gap-2">
        <p className="text-[14px] text-muted">Não foi possível carregar as opções.</p>
        <button type="button" onClick={() => void cardapio.refetch()} className="inline-flex min-h-[44px] items-center text-[14px] font-bold text-brand">
          Tentar de novo
        </button>
      </div>
    )
  } else if (cardapio.data === null) {
    corpo = (
      <div className="flex flex-col items-start gap-2">
        <p className="text-[14px] text-muted">Sem cardápio publicado hoje.</p>
        <Pode permissao="GerenciarCardapio">
          <Link to="/loja/cardapio" className="inline-flex min-h-[44px] items-center text-[14px] font-bold text-brand">
            Ir para o cardápio
          </Link>
        </Pode>
      </div>
    )
  } else {
    corpo = (
      <ul
        aria-label="Opções do cardápio de hoje"
        className={cx(layout === 'grade' && 'grid gap-[10px]', layout !== 'grade' && 'flex flex-col')}
        style={layout === 'grade' ? { gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' } : undefined}
      >
        {opcoes.map(item)}
      </ul>
    )
  }

  if (layout === 'coluna') {
    return (
      <section aria-labelledby="titulo-acabou" className="rounded-cartao border border-line-soft bg-white p-[18px]">
        <div id="titulo-acabou">{titulo}</div>
        <p className="mb-[6px] text-[13px] text-muted">Um toque e o cliente vê na hora.</p>
        {corpo}
      </section>
    )
  }

  return (
    <section aria-label="Acabou alguma coisa?" className="flex flex-col gap-3">
      {titulo}
      {corpo}
    </section>
  )
}
