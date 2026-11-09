import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Opcao } from '../../api/tipos'
import { Button, ClientStatusBadge, FilterPill, Logo, SizeCard } from '../../components/ui'
import { quantidadeDeItens, totalDoCarrinho } from '../../lib/carrinho'
import { categoriaInfo } from '../../lib/categoriaConfig'
import { cx } from '../../lib/cx'
import { formatBRL, pluralizar, rotuloDeAtualizacao } from '../../lib/formatar'
import { tamanhoPadrao } from '../../lib/regrasMarmita'
import { useFocoNoTitulo } from '../../lib/useFocoNoTitulo'
import { CartaoDeErroDeCarga, CartaoSemCardapio, Esqueleto, FaixaDeBloqueio } from './Estados'
import { useCliente } from './useCliente'
import { useDadosDoCliente } from './useDadosDoCliente'

// Tela 1 do celular: Cardapio (spec, 9.3). Cabecalho com Logo e selo, filtro de categoria (so da lista "Hoje tem"),
// corpo (tamanhos, "Hoje tem", "Pra acompanhar") e rodape fixo com o botao de montar ou de ver o pedido.
export function CardapioMobile() {
  const dados = useDadosDoCliente()
  const { itens, adicionarAvulso } = useCliente()
  const navegar = useNavigate()
  const [filtro, setFiltro] = useState<string>('todos')
  const titulo = useFocoNoTitulo()

  const pronto = dados.estado === 'pronto' && !dados.semCardapio
  const filtroEfetivo = dados.categoriasDeComponente.some((categoria) => categoria === filtro) ? filtro : 'todos'
  const hojeTem = filtroEfetivo === 'todos' ? dados.componentes : dados.componentes.filter((opcao) => opcao.categoria === filtroEfetivo)
  const padrao = tamanhoPadrao(dados.tamanhos)
  const quantidadeNoCarrinho = (opcao: Opcao) => itens.find((item) => item.tipo === 'avulso' && item.opcaoId === opcao.id)?.quantidade ?? 0

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <header className="sticky top-0 z-10 border-b border-line-soft bg-white px-5 pt-[18px] pb-[14px]">
        <h1 ref={titulo} tabIndex={-1} className="so-leitor">
          Cardápio
        </h1>
        <div className="flex items-center justify-between gap-[10px]">
          <Logo tamanho="celular" />
          {dados.restaurante ? <ClientStatusBadge aberta={dados.restaurante.aberto} /> : null}
        </div>
        {pronto ? (
          <div role="group" aria-label="Categoria" className="-mx-5 mt-[10px] flex gap-2 overflow-x-auto px-5">
            <FilterPill tamanho="celular" ativa={filtroEfetivo === 'todos'} onClick={() => setFiltro('todos')}>
              Todos
            </FilterPill>
            {dados.categoriasDeComponente.map((categoria) => (
              <FilterPill key={categoria} tamanho="celular" ativa={filtroEfetivo === categoria} onClick={() => setFiltro(categoria)}>
                {categoriaInfo(categoria).rotuloCurto}
              </FilterPill>
            ))}
          </div>
        ) : null}
      </header>

      {dados.motivoDoBloqueio ? <FaixaDeBloqueio motivo={dados.motivoDoBloqueio} /> : null}

      <main className="flex flex-1 flex-col gap-[22px] px-5 pt-[18px] pb-5">
        {dados.estado === 'carregando' ? <CarregandoCardapio /> : null}
        {dados.estado === 'erro' ? <CartaoDeErroDeCarga aoTentarDeNovo={dados.recarregar} /> : null}
        {dados.estado === 'pronto' && dados.semCardapio ? <CartaoSemCardapio /> : null}

        {pronto ? (
          <>
            {dados.atualizadoEm ? <p className="-mb-3 text-[12px] text-muted">Cardápio atualizado {rotuloDeAtualizacao(dados.atualizadoEm)}</p> : null}
            <section aria-labelledby="titulo-monte">
              <h2 id="titulo-monte" className="mb-3 text-[16px] font-bold">
                Monte sua marmita
              </h2>
              <div className="grid grid-cols-3 gap-[10px]">
                {dados.tamanhos.map((tamanho) => (
                  <SizeCard
                    key={tamanho.id}
                    nome={tamanho.nome}
                    itens={tamanho.limitedeComponente}
                    preco={tamanho.preco}
                    para={`/montar/${tamanho.id}`}
                    desabilitado={!dados.podePedir}
                  />
                ))}
              </div>
            </section>

            <section aria-labelledby="titulo-hoje-tem">
              <h2 id="titulo-hoje-tem" className="text-[16px] font-bold">
                Hoje tem
              </h2>
              <ul>
                {hojeTem.map((opcao) => (
                  <li key={opcao.id} className="flex items-center gap-3 border-b border-line-row py-[10px]">
                    <span aria-hidden="true" className="h-7 w-7 shrink-0 rounded-full" style={{ backgroundColor: categoriaInfo(opcao.categoria).cor }} />
                    <span className={cx('flex-1 text-[15px]', opcao.esgotado && 'text-blocked line-through')}>{opcao.nome}</span>
                    <span className="text-[12px] text-muted">{opcao.esgotado ? 'acabou' : categoriaInfo(opcao.categoria).rotulo}</span>
                  </li>
                ))}
              </ul>
            </section>

            {dados.avulsos.length > 0 ? (
              <section aria-labelledby="titulo-acompanhar">
                <h2 id="titulo-acompanhar" className="mb-3 text-[16px] font-bold">
                  Pra acompanhar
                </h2>
                <ul className="flex flex-col gap-2">
                  {dados.avulsos.map((opcao) => {
                    const noCarrinho = quantidadeNoCarrinho(opcao)
                    return (
                      <li key={opcao.id} className="flex items-center gap-3 rounded-cartao bg-surface p-[10px]">
                        <span aria-hidden="true" className="h-10 w-10 shrink-0 rounded-tamanho" style={{ backgroundColor: categoriaInfo(opcao.categoria).cor }} />
                        <div className="min-w-0 flex-1">
                          <p className={cx('text-[14px] font-semibold', opcao.esgotado && 'text-blocked line-through')}>{opcao.nome}</p>
                          <p className="text-[13px] font-bold text-brand">{opcao.esgotado ? 'Esgotado' : formatBRL(opcao.preco ?? 0)}</p>
                        </div>
                        {noCarrinho > 0 ? <span className="text-[14px] font-bold text-brand">{noCarrinho}x</span> : null}
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
                    )
                  })}
                </ul>
              </section>
            ) : null}
          </>
        ) : null}
      </main>

      {pronto ? (
        <footer className="sticky bottom-0 border-t border-line-soft bg-white px-5 pt-3 pb-[18px]">
          {itens.length === 0 ? (
            <Button
              variante="primary-brand"
              altura={52}
              larguraTotal
              disabled={!dados.podePedir || !padrao}
              onClick={() => padrao && navegar(`/montar/${padrao.id}`)}
            >
              Montar minha marmita
            </Button>
          ) : (
            <Button variante="primary-ink" altura={52} larguraTotal onClick={() => navegar('/pedido')}>
              <span className="flex w-full items-center justify-between">
                <span>Ver pedido · {pluralizar(quantidadeDeItens(itens), 'item', 'itens')}</span>
                <span>{formatBRL(totalDoCarrinho(itens))}</span>
              </span>
            </Button>
          )}
        </footer>
      ) : null}
    </div>
  )
}

function CarregandoCardapio() {
  return (
    <div aria-busy="true" aria-label="Carregando o cardápio" role="status" className="flex flex-col gap-[22px]">
      <div className="grid grid-cols-3 gap-[10px]">
        <Esqueleto className="h-[92px]" />
        <Esqueleto className="h-[92px]" />
        <Esqueleto className="h-[92px]" />
      </div>
      <Esqueleto className="h-[160px]" />
      <Esqueleto className="h-[120px]" />
    </div>
  )
}
