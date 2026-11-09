import { useMemo, useState } from 'react'
import type { Cardapio, Opcao } from '../../../api/tipos'
import { Banner, Button, ListCheckbox } from '../../../components/ui'
import { categoriaInfo } from '../../../lib/categoriaConfig'
import { cx } from '../../../lib/cx'
import { formatBRL, pluralizar } from '../../../lib/formatar'
import { useFocoNoTitulo } from '../../../lib/useFocoNoTitulo'
import { useIsDesktop } from '../../../lib/useIsDesktop'
import { CartaoDeErroDeCarga, Esqueleto } from '../../cliente/Estados'
import { useAcoesDoCardapio, useCardapioDoPainel, useTodasAsOpcoes } from './useCardapioDoPainel'

// Bebida e Sobremesa (ordem 0 no mapa) vem depois dos componentes
const ordemDaCategoria = (opcao: Opcao) => categoriaInfo(opcao.categoria).ordem || 50
const porCategoriaENome = (a: Opcao, b: Opcao) => ordemDaCategoria(a) - ordemDaCategoria(b) || a.nome.localeCompare(b.nome, 'pt-BR')

// Textos de apoio de cada estado (spec, 11.3)
const APOIO: Record<string, { texto: string; secundario?: string }> = {
  Rascunho: { texto: 'Escolha feita. O cliente só vê depois que você publicar.', secundario: 'Você pode trocar as opções até publicar.' },
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
  const titulo = useFocoNoTitulo(cardapio !== undefined)
  const semCardapio = cardapio === null

  // sem cardapio ou em rascunho a lista e editavel: mostra todas as opcoes cadastradas para marcar
  const editavel = semCardapio || cardapio?.situacao === 'Rascunho'
  const todas = useTodasAsOpcoes(editavel)
  const [marcadas, setMarcadas] = useState<number[]>([])
  // rascunho: `null` = ainda nao mexeu (vale o que a API tem); com lista = mudanca que ainda nao foi salva
  const [editadas, setEditadas] = useState<number[] | null>(null)
  const opcoesParaEscolher = useMemo(() => (todas.data ?? []).toSorted(porCategoriaENome), [todas.data])

  if (painel.isPending) return <CarregandoCardapio />
  if (painel.isError || cardapio === undefined) return <CartaoDeErroDeCarga aoTentarDeNovo={() => void painel.refetch()} />

  const idsDoCardapio = cardapio ? cardapio.opcoes.map((opcao) => opcao.id) : []
  const selecionadas = cardapio ? (editadas ?? idsDoCardapio) : marcadas
  const trocar = (atuais: number[], id: number) => (atuais.includes(id) ? atuais.filter((marcada) => marcada !== id) : [...atuais, id])
  const alternar = (id: number) => (cardapio ? setEditadas(trocar(selecionadas, id)) : setMarcadas((atuais) => trocar(atuais, id)))
  const mudou = editadas !== null && (editadas.length !== idsDoCardapio.length || editadas.some((id) => !idsDoCardapio.includes(id)))

  const situacao = cardapio?.situacao ?? null
  const mostradas = editavel ? opcoesParaEscolher : cardapio ? [...cardapio.opcoes].sort(porCategoriaENome) : []
  const quantidade = selecionadas.length
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
    const botao = (rotulo: string, ocupado: string, executar: () => void, emAndamento: boolean, desabilitado = false) => (
      <Button
        variante="primary-ink"
        altura={desktop ? 46 : 52}
        raio={desktop ? 'escolha' : 'pilula'}
        larguraTotal={!desktop}
        className={desktop ? 'px-5' : undefined}
        disabled={desabilitado}
        ocupado={emAndamento}
        rotuloOcupado={ocupado}
        onClick={executar}
      >
        {rotulo}
      </Button>
    )
    if (situacao === 'Rascunho') {
      acao = (
        <div className="flex flex-col gap-2">
          {mudou ? (
            <Button
              variante="outline"
              altura={desktop ? 46 : 52}
              raio={desktop ? 'escolha' : 'pilula'}
              larguraTotal={!desktop}
              className={desktop ? 'px-5' : undefined}
              disabled={selecionadas.length === 0}
              ocupado={acoes.alterarOpcoes.isPending}
              rotuloOcupado="Salvando..."
              onClick={() => acoes.alterarOpcoes.mutate({ id: cardapio.id, opcoesIds: selecionadas }, { onSuccess: () => setEditadas(null) })}
            >
              Salvar opções
            </Button>
          ) : null}
          {mudou ? <p className="text-[12px] text-muted">Salve as opções antes de publicar.</p> : null}
          {botao('Publicar cardápio', 'Publicando...', () => acoes.publicar.mutate(cardapio.id), acoes.publicar.isPending, mudou)}
        </div>
      )
    } else if (situacao === 'Publicado') acao = botao('Fechar cardápio', 'Fechando...', () => acoes.fechar.mutate(cardapio.id), acoes.fechar.isPending)
    else if (situacao === 'Fechado') acao = botao('Reabrir cardápio', 'Reabrindo...', () => acoes.publicar.mutate(cardapio.id), acoes.publicar.isPending)
  }

  const erroDaEdicao = acoes.criar.isError ? acoes.criar.error : acoes.alterarOpcoes.isError ? acoes.alterarOpcoes.error : null

  return (
    <div className="flex flex-col gap-4">
      <section
        aria-label="Situação do cardápio"
        className={cx('flex flex-col gap-3 rounded-cartao', desktop ? 'border border-line-soft bg-white px-5 py-[18px]' : 'bg-surface px-4 py-[14px]')}
      >
        <div className="flex flex-wrap items-center gap-3">
          <h1 ref={titulo} tabIndex={-1} className={cx('font-extrabold', desktop ? 'text-[24px]' : 'text-[20px]')}>
            Cardápio do dia
          </h1>
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

        {erroDaEdicao ? <Banner tipo="erro">{erroDaEdicao.message}</Banner> : null}

        {desktop && acao ? <div>{acao}</div> : null}
      </section>

      <p aria-live="polite" className={cx('font-bold text-muted', desktop ? 'text-[14px]' : 'text-[13px]')}>
        {desktop ? `${pluralizar(quantidade, 'opção', 'opções')} no cardápio` : pluralizar(quantidade, 'opção', 'opções')}
      </p>

      {editavel && todas.isPending ? <Esqueleto className="h-[120px]" /> : null}
      {editavel && todas.isError ? <CartaoDeErroDeCarga aoTentarDeNovo={() => void todas.refetch()} /> : null}
      {editavel && todas.data?.length === 0 ? <p className="text-[14px] text-muted">Nenhuma opção cadastrada ainda. Cadastre as opções na aba Cadastros.</p> : null}

      <ul
        aria-label={editavel ? 'Opções para escolher' : 'Opções do cardápio'}
        className={cx(desktop ? 'grid gap-[10px]' : 'flex flex-col')}
        style={desktop ? { gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' } : undefined}
      >
        {mostradas.map((opcao) => {
          const marcada = editavel ? selecionadas.includes(opcao.id) : true
          return (
            <li
              key={opcao.id}
              className={cx(
                desktop ? 'min-h-[52px] rounded-tile border bg-white px-3' : 'min-h-[46px] border-b border-line-row',
                desktop && (marcada ? 'border-brand' : 'border-line-soft'),
              )}
            >
              <ListCheckbox marcado={marcada} desabilitado={!editavel} onAlternar={() => alternar(opcao.id)} aria-label={opcao.nome}>
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
