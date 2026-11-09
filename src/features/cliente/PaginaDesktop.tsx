import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Opcao } from '../../api/tipos'
import { Banner, Button, ClientStatusBadge, FilterPill, IconeFiltro, IngredientTile, Logo, MarmitaIllustration, SizeButton, Stepper, TopNavPill } from '../../components/ui'
import { detalheDoItem, itemEstaEsgotado, quantidadeDeItens } from '../../lib/carrinho'
import { categoriaInfo } from '../../lib/categoriaConfig'
import { cx } from '../../lib/cx'
import { formatBRL, pluralizar, rotuloDeAtualizacao } from '../../lib/formatar'
import { tamanhoPadrao } from '../../lib/regrasMarmita'
import { CartaoDeErroDeCarga, CartaoSemCardapio, Esqueleto, FaixaDeBloqueio } from './Estados'
import { FormularioDoPedido } from './FormularioDoPedido'
import { LinhaDoCarrinho } from './LinhaDoCarrinho'
import { useCliente } from './useCliente'
import { useDadosDoCliente } from './useDadosDoCliente'
import { useFinalizarPedido } from './useFinalizarPedido'
import { useMontagem } from './useMontagem'

// Navegacao do topo (spec, 16.2): Marmitas, Bebidas e Sobremesas, como ancoras. "Marmitas" rola ate o produto; as outras
// rolam ate "Pra acompanhar" ja filtrado pela categoria. Bebidas e Sobremesas so aparecem se houver o que vender nelas.
type DestinoDoTopo = 'marmitas' | 'Bebida' | 'Sobremesa'
const DESTINOS_DE_AVULSO: Array<{ id: Exclude<DestinoDoTopo, 'marmitas'>; rotulo: string }> = [
  { id: 'Bebida', rotulo: 'Bebidas' },
  { id: 'Sobremesa', rotulo: 'Sobremesas' },
]

// `/` no computador (spec, 9.2): pagina unica com filtros, produto, acompanhamentos e carrinho lateral com o formulario.
// Nao existe modo "montar" separado: a secao de produto fica sempre visivel, com o tamanho do meio selecionado ao abrir.
// A query `?tamanho=<id>` so mantem o tamanho escolhido ao recarregar ou ao vir de /montar/:tamanhoId.
export function PaginaDesktop() {
  const dados = useDadosDoCliente()
  const { itens, adicionarMarmita, adicionarAvulso, mudarQuantidade } = useCliente()
  const [parametros, setParametros] = useSearchParams()
  const [filtro, setFiltro] = useState<string>('todos')
  const [quantidade, setQuantidade] = useState(1)
  const [destino, setDestino] = useState<DestinoDoTopo>('marmitas')
  const pedido = useFinalizarPedido(dados)

  const tamanho = dados.tamanhos.find((candidato) => String(candidato.id) === parametros.get('tamanho')) ?? tamanhoPadrao(dados.tamanhos)
  const montagem = useMontagem(tamanho, dados.opcoesPorId, !dados.podePedir)

  const pronto = dados.estado === 'pronto' && !dados.semCardapio
  const filtroEfetivo = dados.categoriasDeComponente.some((categoria) => categoria === filtro) ? filtro : 'todos'
  const ingredientes = filtroEfetivo === 'todos' ? dados.componentes : dados.componentes.filter((opcao) => opcao.categoria === filtroEfetivo)

  function trocarTamanho(id: number) {
    const novo = dados.tamanhos.find((candidato) => candidato.id === id)
    if (!novo || novo.id === tamanho?.id) return
    montagem.trocarTamanho(novo) // mantem a selecao, cortando o que nao cabe (secao 12.2)
    setParametros({ tamanho: String(novo.id) }, { replace: true })
  }

  function adicionar() {
    if (!tamanho || montagem.selecionados.length === 0) return
    adicionarMarmita({ id: tamanho.id, nome: tamanho.nome, preco: tamanho.preco }, montagem.selecionados, quantidade)
    montagem.limpar()
    setQuantidade(1)
  }

  function irPara(novo: DestinoDoTopo) {
    setDestino(novo)
    document.getElementById(novo === 'marmitas' ? 'secao-produto' : 'secao-acompanhar')?.scrollIntoView?.()
  }

  // "Pra acompanhar" filtrado pela categoria escolhida no topo (Marmitas = sem filtro)
  const avulsosMostrados = destino === 'marmitas' ? dados.avulsos : dados.avulsos.filter((opcao) => opcao.categoria === destino)

  const noCarrinho = (opcao: Opcao) => itens.find((item) => item.tipo === 'avulso' && item.opcaoId === opcao.id)?.quantidade ?? 0
  const total = quantidadeDeItens(itens)

  return (
    <div className="min-h-dvh bg-canvas p-7">
      <div className="mx-auto max-w-[1180px] overflow-hidden rounded-app bg-white shadow-cartao">
        <header className="flex items-center gap-6 border-b border-line-soft px-7 py-5">
          <Logo />
          <nav aria-label="Seções" className="flex flex-1 gap-2">
            {pronto ? (
              <>
                <TopNavPill ativa={destino === 'marmitas'} onClick={() => irPara('marmitas')}>
                  Marmitas
                </TopNavPill>
                {DESTINOS_DE_AVULSO.filter(({ id }) => dados.avulsos.some((opcao) => opcao.categoria === id)).map(({ id, rotulo }) => (
                  <TopNavPill key={id} ativa={destino === id} onClick={() => irPara(id)}>
                    {rotulo}
                  </TopNavPill>
                ))}
              </>
            ) : null}
          </nav>
          {dados.restaurante ? <ClientStatusBadge aberta={dados.restaurante.aberto} /> : null}
        </header>

        {dados.motivoDoBloqueio ? <FaixaDeBloqueio motivo={dados.motivoDoBloqueio} /> : null}

        <div className="flex">
          <main className="min-w-[640px] flex-[2] border-r border-line-soft px-7 pt-7 pb-8">
            {dados.estado === 'carregando' ? <CarregandoPagina /> : null}
            {dados.estado === 'erro' ? <CartaoDeErroDeCarga aoTentarDeNovo={dados.recarregar} /> : null}
            {dados.estado === 'pronto' && dados.semCardapio ? <CartaoSemCardapio /> : null}

            {pronto && tamanho ? (
              <div className="flex flex-col gap-7">
                {dados.atualizadoEm ? <p className="-mb-4 text-[13px] text-muted">Cardápio atualizado {rotuloDeAtualizacao(dados.atualizadoEm)}</p> : null}
                <section aria-labelledby="titulo-categoria">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 id="titulo-categoria" className="text-[18px] font-bold">
                      Categoria da marmita
                    </h2>
                    <IconeFiltro tamanho={20} aria-hidden="true" />
                  </div>
                  <div role="group" aria-label="Categoria" className="flex flex-wrap gap-2">
                    <FilterPill ativa={filtroEfetivo === 'todos'} onClick={() => setFiltro('todos')}>
                      Todos
                    </FilterPill>
                    {dados.categoriasDeComponente.map((categoria) => (
                      <FilterPill key={categoria} ativa={filtroEfetivo === categoria} onClick={() => setFiltro(categoria)}>
                        {categoriaInfo(categoria).rotulo}
                      </FilterPill>
                    ))}
                  </div>
                </section>

                <section id="secao-produto" aria-label="Produto" className="flex flex-wrap gap-7">
                  <div className="flex min-h-[260px] min-w-[260px] flex-1 items-center justify-center rounded-ilustracao bg-illustration-bg p-5">
                    <MarmitaIllustration />
                  </div>
                  <div className="flex min-w-[280px] flex-1 flex-col gap-[14px]">
                    <div>
                      <h1 className="text-[28px] font-extrabold">Marmita {tamanho.nome}</h1>
                      <p className="mt-1 text-[14px] leading-normal text-muted">Marmita montada na hora, com os ingredientes que você escolher abaixo.</p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span id="rotulo-tamanho" className="text-[12px] font-bold tracking-wide text-muted">
                        TAMANHO
                      </span>
                      <div role="group" aria-labelledby="rotulo-tamanho" className="flex flex-wrap gap-2">
                        {dados.tamanhos.map((candidato) => (
                          <SizeButton key={candidato.id} ativo={candidato.id === tamanho.id} onClick={() => trocarTamanho(candidato.id)}>
                            {candidato.nome}
                          </SizeButton>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span id="rotulo-monte" aria-live="polite" className="text-[12px] font-bold tracking-wide text-muted">
                        MONTE SUA MARMITA · {montagem.selecionados.length}/{tamanho.limitedeComponente}
                      </span>
                      <div role="group" aria-labelledby="rotulo-monte" className="flex flex-wrap gap-[10px]">
                        {ingredientes.map((opcao) => (
                          <IngredientTile
                            key={opcao.id}
                            nome={opcao.nome}
                            categoria={opcao.categoria}
                            marcado={montagem.selecionados.includes(opcao.id)}
                            bloqueado={montagem.bloqueado(opcao)}
                            esgotado={opcao.esgotado}
                            onAlternar={() => montagem.alternar(opcao.id)}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="mt-1 flex items-center gap-[14px]">
                      <Stepper valor={quantidade} aoMudar={setQuantidade} rotulo={`Quantidade de Marmita ${tamanho.nome}`} />
                      <Button
                        variante="primary-ink"
                        altura={48}
                        className="flex-1"
                        disabled={montagem.selecionados.length === 0 || !dados.podePedir}
                        onClick={adicionar}
                      >
                        <span className="flex w-full items-center justify-between">
                          <span>{formatBRL(tamanho.preco * quantidade)}</span>
                          <span>Adicionar</span>
                        </span>
                      </Button>
                    </div>
                  </div>
                </section>

                {dados.avulsos.length > 0 ? (
                  <section id="secao-acompanhar" aria-labelledby="titulo-acompanhar">
                    <h2 id="titulo-acompanhar" className="mb-3 text-[16px] font-bold">
                      Pra acompanhar
                    </h2>
                    <ul className="grid gap-[14px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}>
                      {avulsosMostrados.map((opcao) => (
                        <li key={opcao.id} className="flex items-center gap-3 rounded-cartao border border-line-soft p-3">
                          <span aria-hidden="true" className="h-11 w-11 shrink-0 rounded-escolha" style={{ backgroundColor: categoriaInfo(opcao.categoria).cor }} />
                          <div className="min-w-0 flex-1">
                            <p className={cx('truncate text-[14px] font-semibold', opcao.esgotado && 'text-blocked line-through')}>{opcao.nome}</p>
                            <p className="text-[13px] font-bold text-brand">{opcao.esgotado ? 'Esgotado' : formatBRL(opcao.preco ?? 0)}</p>
                          </div>
                          {noCarrinho(opcao) > 0 ? <span className="text-[13px] font-bold text-brand">{noCarrinho(opcao)}x</span> : null}
                          <button
                            type="button"
                            aria-label={`Adicionar ${opcao.nome}`}
                            disabled={opcao.esgotado || !dados.podePedir}
                            onClick={() => adicionarAvulso({ id: opcao.id, nome: opcao.nome, preco: opcao.preco ?? 0 })}
                            className="toque-q relative grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-[18px] leading-none font-bold text-white disabled:bg-disabled-bg disabled:text-disabled-fg"
                            style={{ '--lado': '32px' } as React.CSSProperties}
                          >
                            +
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>
            ) : null}
          </main>

          {pronto ? (
            <aside id="secao-pedido" aria-label="Meu pedido" className="min-w-[320px] flex-1">
              <div className="sticky top-6 flex max-h-[calc(100dvh-48px)] flex-col gap-4 overflow-y-auto px-6 py-7">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-[20px] font-extrabold">Meu pedido</h2>
                  <span className="text-[13px] text-muted">{pluralizar(total, 'item', 'itens')}</span>
                </div>

                {itens.length === 0 ? (
                  <p className="text-[14px] text-muted">Seu pedido vai aparecer aqui.</p>
                ) : (
                  <ul aria-label="Itens do pedido" className="flex flex-col gap-2">
                    {itens.map((item) => (
                      <LinhaDoCarrinho
                        key={item.chave}
                        item={item}
                        detalhe={detalheDoItem(item, dados.opcoesPorId)}
                        esgotado={itemEstaEsgotado(item, dados.opcoesPorId)}
                        tamanho="desktop"
                        aoMudarQuantidade={(nova) => mudarQuantidade(item.chave, nova)}
                      />
                    ))}
                  </ul>
                )}

                <FormularioDoPedido />

                <div className="flex items-baseline justify-between border-t border-dashed border-dash pt-[10px]">
                  <span className="text-[20px] font-extrabold">Total</span>
                  <span className="text-[20px] font-extrabold">{formatBRL(pedido.total)}</span>
                </div>

                {pedido.erro ? <Banner tipo="erro">{pedido.erro}</Banner> : null}
                {pedido.pendencia ? (
                  <p aria-live="polite" className="text-center text-[13px] text-muted">
                    {pedido.pendencia}
                  </p>
                ) : null}
                <Button
                  variante="primary-brand"
                  altura={52}
                  raio="confirmar"
                  larguraTotal
                  disabled={!pedido.podeFinalizar}
                  ocupado={pedido.enviando}
                  rotuloOcupado="Enviando..."
                  onClick={pedido.finalizar}
                  className="text-[16px] font-bold"
                >
                  Confirmar pedido
                </Button>
                <p className="text-center text-[12px] text-muted">O pedido chega no WhatsApp da loja.</p>
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function CarregandoPagina() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando o cardápio" className="flex flex-col gap-7">
      <Esqueleto className="h-10 w-1/2" />
      <div className="flex gap-7">
        <Esqueleto className="h-[260px] flex-1 rounded-ilustracao" />
        <Esqueleto className="h-[260px] flex-1" />
      </div>
      <Esqueleto className="h-[120px]" />
    </div>
  )
}
