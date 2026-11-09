import { useMemo, useState } from 'react'
import { ehApiError } from '../../../api/client'
import type { Cardapio, Opcao } from '../../../api/tipos'
import { Banner, Button, ListCheckbox } from '../../../components/ui'
import { categoriaInfo } from '../../../lib/categoriaConfig'
import { cx } from '../../../lib/cx'
import { formatBRL, pluralizar } from '../../../lib/formatar'
import { useIsDesktop } from '../../../lib/useIsDesktop'
import { CartaoDeErroDeCarga, Esqueleto } from '../../cliente/Estados'
import { useAcoesDoCardapio, useCardapioDoPainel, useTodasAsOpcoes } from './useCardapioDoPainel'

// Bebida e Sobremesa (ordem 0 no mapa) vem depois dos componentes
const ordemDaCategoria = (opcao: Opcao) => categoriaInfo(opcao.categoria).ordem || 50
const porCategoriaENome = (a: Opcao, b: Opcao) => ordemDaCategoria(a) - ordemDaCategoria(b) || a.nome.localeCompare(b.nome, 'pt-BR')

// Textos de apoio de cada estado (spec, 11.3)
const APOIO: Record<string, { texto: string; secundario?: string }> = {
  Rascunho: { texto: 'Escolha feita. O cliente só vê depois que você publicar.', secundario: 'Hoje não dá para trocar as opções de um cardápio criado.' },
  Publicado: { texto: 'O cliente já está vendo. Pra tirar um item hoje, marque como esgotado na aba Hoje.' },
  Fechado: { texto: 'Encerrado por hoje.' },
}

// Aba Cardapio (GerenciarCardapio, spec 11.3). Um cardapio por dia, sempre do "hoje" de Brasilia. Quatro estados:
// sem cardapio (escolher opcoes e criar), rascunho (publicar), publicado (fechar) e fechado (reabrir).
export function CardapioPage() {
  const desktop = useIsDesktop()
  const painel = useCardapioDoPainel()
  const acoes = useAcoesDoCardapio()
  const cardapio: Cardapio | null | undefined = painel.data
  const semCardapio = cardapio === null

  const todas = useTodasAsOpcoes(semCardapio)
  const [marcadas, setMarcadas] = useState<number[]>([])
  const opcoesParaEscolher = useMemo(() => (todas.data ?? []).toSorted(porCategoriaENome), [todas.data])

  if (painel.isPending) return <CarregandoCardapio />
  if (painel.isError || cardapio === undefined) return <CartaoDeErroDeCarga aoTentarDeNovo={() => void painel.refetch()} />

  const alternar = (id: number) => setMarcadas((atuais) => (atuais.includes(id) ? atuais.filter((marcada) => marcada !== id) : [...atuais, id]))

  const situacao = cardapio?.situacao ?? null
  const mostradas = cardapio ? [...cardapio.opcoes].sort(porCategoriaENome) : opcoesParaEscolher
  const quantidade = cardapio ? cardapio.opcoes.length : marcadas.length
  const apoio = situacao ? APOIO[situacao] : undefined

  // ---- botao de acao de cada estado ----
  let acao
  if (semCardapio) {
    acao = (
      <Button
        variante="primary-ink"
        altura={desktop ? 46 : 52}
        raio={desktop ? 'escolha' : 'pilula'}
        larguraTotal={!desktop}
        className={desktop ? 'px-5' : undefined}
        disabled={marcadas.length === 0}
        ocupado={acoes.criar.isPending}
        rotuloOcupado="Criando..."
        onClick={() => acoes.criar.mutate(marcadas)}
      >
        Criar cardápio
      </Button>
    )
  } else if (cardapio) {
    const botao = (rotulo: string, ocupado: string, executar: () => void, emAndamento: boolean) => (
      <Button
        variante="primary-ink"
        altura={desktop ? 46 : 52}
        raio={desktop ? 'escolha' : 'pilula'}
        larguraTotal={!desktop}
        className={desktop ? 'px-5' : undefined}
        ocupado={emAndamento}
        rotuloOcupado={ocupado}
        onClick={executar}
      >
        {rotulo}
      </Button>
    )
    if (situacao === 'Rascunho') acao = botao('Publicar cardápio', 'Publicando...', () => acoes.publicar.mutate(cardapio.id), acoes.publicar.isPending)
    else if (situacao === 'Publicado') acao = botao('Fechar cardápio', 'Fechando...', () => acoes.fechar.mutate(cardapio.id), acoes.fechar.isPending)
    else if (situacao === 'Fechado') acao = botao('Reabrir cardápio', 'Reabrindo...', () => acoes.publicar.mutate(cardapio.id), acoes.publicar.isPending)
  }

  const erroAoCriar = acoes.criar.isError ? acoes.criar.error : null

  return (
    <div className="flex flex-col gap-4">
      <section
        aria-label="Situação do cardápio"
        className={cx('flex flex-col gap-3 rounded-cartao', desktop ? 'border border-line-soft bg-white px-5 py-[18px]' : 'bg-surface px-4 py-[14px]')}
      >
        <div className="flex flex-wrap items-center gap-3">
          <h1 className={cx('font-extrabold', desktop ? 'text-[24px]' : 'text-[20px]')}>Cardápio do dia</h1>
          {situacao ? <span className="rounded-pilula bg-brand-tint px-3 py-1 text-[13px] font-bold text-brand-strong">{situacao}</span> : null}
        </div>
        {semCardapio ? (
          <p className="text-[14px] text-muted">Ainda não há cardápio de hoje. Escolha as opções e crie o cardápio.</p>
        ) : apoio ? (
          <div className="flex flex-col gap-1">
            <p className="text-[14px]">{apoio.texto}</p>
            {apoio.secundario ? <p className="text-[13px] text-muted">{apoio.secundario}</p> : null}
          </div>
        ) : null}

        {erroAoCriar ? (
          <div className="flex flex-col gap-1">
            <Banner tipo="erro">{erroAoCriar.message}</Banner>
            {ehApiError(erroAoCriar) && erroAoCriar.status === 409 ? (
              <p className="text-[13px] text-muted">Esse cardápio está em rascunho e não pode ser aberto por este painel.</p>
            ) : null}
          </div>
        ) : null}

        {desktop && acao ? <div>{acao}</div> : null}
      </section>

      <p aria-live="polite" className={cx('font-bold text-muted', desktop ? 'text-[14px]' : 'text-[13px]')}>
        {desktop ? `${pluralizar(quantidade, 'opção', 'opções')} no cardápio` : pluralizar(quantidade, 'opção', 'opções')}
      </p>

      {semCardapio && todas.isPending ? <Esqueleto className="h-[120px]" /> : null}
      {semCardapio && todas.isError ? <CartaoDeErroDeCarga aoTentarDeNovo={() => void todas.refetch()} /> : null}
      {semCardapio && todas.data?.length === 0 ? <p className="text-[14px] text-muted">Nenhuma opção cadastrada ainda. Cadastre as opções na aba Cadastros.</p> : null}

      <ul
        aria-label={semCardapio ? 'Opções para escolher' : 'Opções do cardápio'}
        className={cx(desktop ? 'grid gap-[10px]' : 'flex flex-col')}
        style={desktop ? { gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' } : undefined}
      >
        {mostradas.map((opcao) => {
          const marcada = cardapio ? true : marcadas.includes(opcao.id)
          return (
            <li
              key={opcao.id}
              className={cx(
                desktop ? 'min-h-[52px] rounded-tile border bg-white px-3' : 'min-h-[46px] border-b border-line-row',
                desktop && (marcada ? 'border-brand' : 'border-line-soft'),
              )}
            >
              <ListCheckbox marcado={marcada} desabilitado={cardapio !== null} onAlternar={() => alternar(opcao.id)} aria-label={opcao.nome}>
                <span className="block">{opcao.nome}</span>
                <span className="block text-[12px] font-normal text-muted">
                  {categoriaInfo(opcao.categoria).rotulo}
                  {opcao.preco !== null ? ` · ${formatBRL(opcao.preco)}` : ''}
                </span>
              </ListCheckbox>
            </li>
          )
        })}
      </ul>

      {!desktop && acao ? <div className="sticky bottom-14 mt-2">{acao}</div> : null}
    </div>
  )
}

function CarregandoCardapio() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando o cardápio" className="flex flex-col gap-3">
      <Esqueleto className="h-[110px]" />
      <Esqueleto className="h-[200px]" />
    </div>
  )
}
