import { useMemo, useState, type CSSProperties } from 'react'
import type { Cardapio, Opcao } from '../../../api/tipos'
import { Banner, Button, ListCheckbox } from '../../../components/ui'
import { categoriaInfo } from '../../../lib/categoriaConfig'
import { cx } from '../../../lib/cx'
import { formatBRL, pluralizar, rotuloDeAtualizacao } from '../../../lib/formatar'
import { useFocoNoTitulo } from '../../../lib/useFocoNoTitulo'
import { useIsDesktop } from '../../../lib/useIsDesktop'
import { CartaoDeErroDeCarga, Esqueleto } from '../../cliente/Estados'
import { useAcoesDoCardapio, useCardapioDoPainel, useTodasAsOpcoes } from './useCardapioDoPainel'

// Componentes de marmita na ordem da secao 12.1; Bebida e Sobremesa (ordem 0 no mapa) depois
const ordemDaCategoria = (opcao: Opcao) => categoriaInfo(opcao.categoria).ordem || 50
const comparar = (a: Opcao, b: Opcao) =>
  ordemDaCategoria(a) - ordemDaCategoria(b) || a.categoria.localeCompare(b.categoria) || a.nome.localeCompare(b.nome, 'pt-BR')

interface Grupo {
  categoria: string
  itens: Opcao[]
}

function agruparPorCategoria(opcoes: readonly Opcao[]): Grupo[] {
  const grupos = new Map<string, Opcao[]>()
  for (const opcao of [...opcoes].sort(comparar)) grupos.set(opcao.categoria, [...(grupos.get(opcao.categoria) ?? []), opcao])
  return [...grupos.entries()].map(([categoria, itens]) => ({ categoria, itens }))
}

// Textos de apoio de cada estado (spec, 11.3)
const APOIO: Record<string, { texto: string; secundario?: string }> = {
  Rascunho: { texto: 'Escolha feita. O cliente só vê depois que você publicar.', secundario: 'Você pode trocar as opções até publicar.' },
  Publicado: { texto: 'O cliente já está vendo.', secundario: 'Você pode incluir novas opções. Pra tirar um item hoje, marque como esgotado na aba Hoje.' },
  Fechado: { texto: 'Encerrado por hoje.' },
}

const trocar = (ids: number[], id: number) => (ids.includes(id) ? ids.filter((marcado) => marcado !== id) : [...ids, id])

// Aba Cardapio (GerenciarCardapio, spec 11.3). Um cardapio por dia, sempre do "hoje" de Brasilia. Quatro estados:
// sem cardapio (escolher opcoes e criar), rascunho (trocar e publicar), publicado (incluir opcoes novas e fechar) e fechado (reabrir).
// As opcoes aparecem agrupadas por categoria, e a barra de acao fica sempre visivel no fim da tela.
export function CardapioPage() {
  const desktop = useIsDesktop()
  const painel = useCardapioDoPainel()
  const acoes = useAcoesDoCardapio()
  const cardapio: Cardapio | null | undefined = painel.data
  const titulo = useFocoNoTitulo(cardapio !== undefined)
  const semCardapio = cardapio === null
  const situacao = cardapio?.situacao ?? null

  // sem cardapio, em rascunho ou publicado a lista e editavel e mostra todas as opcoes cadastradas.
  // Publicado so ACRESCENTA: as que ja estao no cardapio ficam travadas (tirar um item e pelo esgotado)
  const editavel = semCardapio || situacao === 'Rascunho' || situacao === 'Publicado'
  const todas = useTodasAsOpcoes(editavel)
  const [marcadas, setMarcadas] = useState<number[]>([])
  // rascunho e publicado: `null` = ainda nao mexeu (vale o que a API tem); com lista = mudanca que ainda nao foi salva
  const [editadas, setEditadas] = useState<number[] | null>(null)

  const grupos = useMemo(() => agruparPorCategoria(editavel ? (todas.data ?? []) : (cardapio?.opcoes ?? [])), [editavel, todas.data, cardapio])

  if (painel.isPending) return <CarregandoCardapio />
  if (painel.isError || cardapio === undefined) return <CartaoDeErroDeCarga aoTentarDeNovo={() => void painel.refetch()} />

  const idsDoCardapio = cardapio ? cardapio.opcoes.map((opcao) => opcao.id) : []
  const travadas = situacao === 'Publicado' ? idsDoCardapio : []
  const selecionadas = cardapio ? (editadas ?? idsDoCardapio) : marcadas
  const mudou = editadas !== null && (editadas.length !== idsDoCardapio.length || editadas.some((id) => !idsDoCardapio.includes(id)))
  const alterar = (ids: number[]) => (cardapio ? setEditadas(ids) : setMarcadas(ids))

  function marcarGrupo(itens: Opcao[], marcar: boolean) {
    const livres = itens.filter((opcao) => !travadas.includes(opcao.id)).map((opcao) => opcao.id)
    alterar(marcar ? [...new Set([...selecionadas, ...livres])] : selecionadas.filter((id) => !livres.includes(id)))
  }

  const apoio = situacao ? APOIO[situacao] : undefined
  const quantidade = selecionadas.length
  const erroDaEdicao = acoes.criar.isError ? acoes.criar.error : acoes.alterarOpcoes.isError ? acoes.alterarOpcoes.error : null
  const salvar = (aoSalvar: () => void) => (cardapio ? acoes.alterarOpcoes.mutate({ id: cardapio.id, opcoesIds: selecionadas }, { onSuccess: aoSalvar }) : undefined)

  // ---- botoes de cada estado ----
  const estilo = { altura: desktop ? (46 as const) : (52 as const), raio: desktop ? ('escolha' as const) : ('pilula' as const), larguraTotal: !desktop, className: desktop ? 'px-5' : undefined }

  let botoes
  let dica: string | null = null
  if (semCardapio) {
    botoes = (
      <Button {...estilo} variante="primary-ink" disabled={marcadas.length === 0} ocupado={acoes.criar.isPending} rotuloOcupado="Criando..." onClick={() => acoes.criar.mutate(marcadas)}>
        Criar cardápio
      </Button>
    )
  } else if (cardapio && situacao === 'Rascunho') {
    dica = mudou ? 'Salve as opções antes de publicar.' : null
    botoes = (
      <>
        {mudou ? (
          <Button {...estilo} variante="outline" disabled={quantidade === 0} ocupado={acoes.alterarOpcoes.isPending} rotuloOcupado="Salvando..." onClick={() => salvar(() => setEditadas(null))}>
            Salvar opções
          </Button>
        ) : null}
        <Button {...estilo} variante="primary-ink" disabled={mudou} ocupado={acoes.publicar.isPending} rotuloOcupado="Publicando..." onClick={() => acoes.publicar.mutate(cardapio.id)}>
          Publicar cardápio
        </Button>
      </>
    )
  } else if (cardapio && situacao === 'Publicado') {
    dica = mudou ? 'As novas opções só aparecem para o cliente depois de adicionar.' : null
    botoes = (
      <>
        {mudou ? (
          <Button {...estilo} variante="outline" ocupado={acoes.alterarOpcoes.isPending} rotuloOcupado="Adicionando..." onClick={() => salvar(() => setEditadas(null))}>
            Adicionar ao cardápio
          </Button>
        ) : null}
        <Button {...estilo} variante="primary-ink" disabled={mudou} ocupado={acoes.fechar.isPending} rotuloOcupado="Fechando..." onClick={() => acoes.fechar.mutate(cardapio.id)}>
          Fechar cardápio
        </Button>
      </>
    )
  } else if (cardapio && situacao === 'Fechado') {
    botoes = (
      <Button {...estilo} variante="primary-ink" ocupado={acoes.publicar.isPending} rotuloOcupado="Reabrindo..." onClick={() => acoes.publicar.mutate(cardapio.id)}>
        Reabrir cardápio
      </Button>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <section aria-label="Situação do cardápio" className={cx('flex flex-col gap-2 rounded-cartao', desktop ? 'border border-line-soft bg-white px-5 py-[18px]' : 'bg-surface px-4 py-[14px]')}>
        <div className="flex flex-wrap items-center gap-3">
          <h1 ref={titulo} tabIndex={-1} className={cx('font-extrabold', desktop ? 'text-[24px]' : 'text-[20px]')}>
            Cardápio do dia
          </h1>
          {situacao ? <span className="rounded-pilula bg-brand-tint px-3 py-1 text-[13px] font-bold text-brand-strong">{situacao}</span> : null}
          {cardapio?.atualizadoEm ? <span className="text-[13px] text-muted">Atualizado {rotuloDeAtualizacao(cardapio.atualizadoEm)}</span> : null}
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
      </section>

      {editavel && todas.isPending ? <Esqueleto className="h-[120px]" /> : null}
      {editavel && todas.isError ? <CartaoDeErroDeCarga aoTentarDeNovo={() => void todas.refetch()} /> : null}
      {editavel && todas.data?.length === 0 ? <p className="text-[14px] text-muted">Nenhuma opção cadastrada ainda. Cadastre as opções na aba Cadastros.</p> : null}

      {grupos.map(({ categoria, itens }) => {
        const info = categoriaInfo(categoria)
        const livres = itens.filter((opcao) => !travadas.includes(opcao.id))
        const marcadasNoGrupo = itens.filter((opcao) => (editavel ? selecionadas.includes(opcao.id) : true)).length
        const todasMarcadas = livres.length > 0 && livres.every((opcao) => selecionadas.includes(opcao.id))

        return (
          <section key={categoria} aria-label={info.rotulo} className="flex flex-col gap-[10px]">
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: info.cor }} />
              <h2 className="text-[16px] font-bold">{info.rotulo}</h2>
              <span className="text-[12px] text-muted">{editavel ? `${marcadasNoGrupo} de ${itens.length}` : pluralizar(itens.length, 'item', 'itens')}</span>
              {editavel && livres.length > 0 ? (
                <button
                  type="button"
                  onClick={() => marcarGrupo(itens, !todasMarcadas)}
                  aria-label={`${todasMarcadas ? 'Limpar' : 'Marcar todas de'} ${info.rotulo}`}
                  className="toque-v ml-auto text-[13px] font-bold text-brand hover:text-brand-strong"
                  style={{ '--h': '28px' } as CSSProperties}
                >
                  {todasMarcadas ? 'Limpar' : 'Marcar todas'}
                </button>
              ) : null}
            </div>

            <ul
              aria-label={`Opções de ${info.rotulo}`}
              className={desktop ? 'grid gap-[10px]' : 'flex flex-col gap-2'}
              style={desktop ? { gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' } : undefined}
            >
              {itens.map((opcao) => {
                const marcada = editavel ? selecionadas.includes(opcao.id) : true
                const travada = travadas.includes(opcao.id)
                return (
                  <li key={opcao.id} className={cx('rounded-tile border transition-colors', marcada ? 'border-brand bg-brand-tint' : 'border-line-soft bg-white')}>
                    <ListCheckbox
                      marcado={marcada}
                      desabilitado={!editavel || travada}
                      onAlternar={() => alterar(trocar(selecionadas, opcao.id))}
                      aria-label={opcao.nome}
                      className="min-h-[56px] px-3 py-2"
                    >
                      <span className="flex w-full items-center justify-between gap-3">
                        <span className="flex flex-col">
                          <span>{opcao.nome}</span>
                          {travada ? <span className="text-[11px] font-normal text-muted">Já no cardápio</span> : null}
                        </span>
                        <span className={cx('shrink-0 text-[13px]', opcao.preco !== null ? 'font-bold text-brand' : 'font-normal text-muted')}>
                          {opcao.preco !== null ? formatBRL(opcao.preco) : 'só em marmita'}
                        </span>
                      </span>
                    </ListCheckbox>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}

      {/* barra de acao: sempre visivel, com quantas opcoes estao no cardapio */}
      <div
        className={cx(
          'sticky z-10 flex gap-3 rounded-cartao border border-line-soft bg-white p-3 shadow-cartao',
          desktop ? 'bottom-4 flex-wrap items-center justify-between' : 'bottom-16 flex-col',
        )}
      >
        <p aria-live="polite" className={cx('font-bold text-muted', desktop ? 'text-[14px]' : 'text-[13px]')}>
          {desktop ? `${pluralizar(quantidade, 'opção', 'opções')} no cardápio` : pluralizar(quantidade, 'opção', 'opções')}
        </p>
        <div className={cx('flex gap-2', desktop ? 'items-center' : 'flex-col')}>
          {dica ? <p className="text-[12px] text-muted">{dica}</p> : null}
          {botoes}
        </div>
      </div>
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
