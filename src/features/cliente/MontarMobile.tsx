import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button, IconeVoltar, IngredientTile, SizeButton } from '../../components/ui'
import { categoriaInfo } from '../../lib/categoriaConfig'
import { formatBRL } from '../../lib/formatar'
import { limiteDaCategoria } from '../../lib/regrasMarmita'
import { useFocoNoTitulo } from '../../lib/useFocoNoTitulo'
import { CartaoDeErroDeCarga, CartaoSemCardapio, Esqueleto, FaixaDeBloqueio } from './Estados'
import { useCliente } from './useCliente'
import { useDadosDoCliente } from './useDadosDoCliente'
import { useMontagem } from './useMontagem'

// Tela 2 do celular: Montar marmita (spec, 9.3). Um grupo por categoria de componente que exista no cardapio.
export function MontarMobile() {
  const { tamanhoId } = useParams()
  const navegar = useNavigate()
  const dados = useDadosDoCliente()
  const { adicionarMarmita } = useCliente()

  const tamanho = dados.tamanhos.find((candidato) => String(candidato.id) === tamanhoId)
  const montagem = useMontagem(tamanho, dados.opcoesPorId, !dados.podePedir)
  const titulo = useFocoNoTitulo(tamanho !== undefined)

  // tamanho que nao existe (link velho): volta para o cardapio
  if (dados.estado === 'pronto' && !dados.semCardapio && !tamanho) return <Navigate to="/" replace />

  function trocarTamanho(id: number) {
    const novo = dados.tamanhos.find((candidato) => candidato.id === id)
    if (!novo || novo.id === tamanho?.id) return
    montagem.trocarTamanho(novo) // mantem a selecao, cortando o que nao cabe (secao 12.2)
    navegar(`/montar/${novo.id}`, { replace: true })
  }

  function adicionar() {
    if (!tamanho || montagem.selecionados.length === 0) return
    adicionarMarmita({ id: tamanho.id, nome: tamanho.nome, preco: tamanho.preco }, montagem.selecionados)
    montagem.limpar()
    navegar('/')
  }

  const vazio = montagem.selecionados.length === 0

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <header className="sticky top-0 z-10 flex flex-col gap-[10px] border-b border-line-soft bg-white px-5 pt-4 pb-[14px]">
        <div>
          <Button variante="ghost-back" altura={36} onClick={() => navegar('/')} className="-ml-2 gap-1 px-2">
            <IconeVoltar tamanho={16} />
            Cardápio
          </Button>
        </div>
        {tamanho ? (
          <>
            <h1 ref={titulo} tabIndex={-1} className="text-[24px] font-extrabold">
              Marmita {tamanho.nome}
            </h1>
            <div className="flex items-center justify-between gap-3">
              <div role="group" aria-label="Tamanho" className="flex gap-2 overflow-x-auto">
                {dados.tamanhos.map((candidato) => (
                  <SizeButton key={candidato.id} tamanho="celular" ativo={candidato.id === tamanho.id} onClick={() => trocarTamanho(candidato.id)}>
                    {candidato.nome}
                  </SizeButton>
                ))}
              </div>
              <span aria-live="polite" aria-label="Itens escolhidos" className="shrink-0 text-[13px] font-bold text-muted">
                {montagem.selecionados.length}/{tamanho.limitedeComponente}
              </span>
            </div>
          </>
        ) : null}
      </header>

      {dados.motivoDoBloqueio ? <FaixaDeBloqueio motivo={dados.motivoDoBloqueio} /> : null}

      <main className="flex flex-1 flex-col gap-[18px] px-5 pt-4 pb-[18px]">
        {dados.estado === 'carregando' ? (
          <div role="status" aria-busy="true" aria-label="Carregando" className="flex flex-col gap-3">
            <Esqueleto className="h-[110px]" />
            <Esqueleto className="h-[110px]" />
          </div>
        ) : null}
        {dados.estado === 'erro' ? <CartaoDeErroDeCarga aoTentarDeNovo={dados.recarregar} /> : null}
        {dados.estado === 'pronto' && dados.semCardapio ? <CartaoSemCardapio /> : null}

        {tamanho
          ? dados.categoriasDeComponente.map((categoria) => {
              const limite = limiteDaCategoria(tamanho, categoria)
              const ingredientes = dados.componentes.filter((opcao) => opcao.categoria === categoria)
              return (
                <section key={categoria} aria-label={categoriaInfo(categoria).rotulo}>
                  <div className="mb-[10px] flex items-baseline gap-2">
                    <h2 className="text-[15px] font-bold">{categoriaInfo(categoria).rotulo}</h2>
                    {limite !== null ? (
                      <span className="text-[12px] font-semibold text-brand-strong">{limite === 0 ? 'não incluso neste tamanho' : `até ${limite}`}</span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-[10px]">
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
                </section>
              )
            })
          : null}
      </main>

      {tamanho ? (
        <footer className="sticky bottom-0 flex flex-col gap-2 border-t border-line-soft bg-white px-5 pt-3 pb-[18px]">
          {vazio ? <p className="text-center text-[13px] text-muted">Escolha pelo menos um item</p> : null}
          <Button variante="primary-ink" altura={52} larguraTotal disabled={vazio || !dados.podePedir} onClick={adicionar}>
            <span className="flex w-full items-center justify-between">
              <span>Adicionar ao pedido</span>
              <span>{formatBRL(tamanho.preco)}</span>
            </span>
          </Button>
        </footer>
      ) : null}
    </div>
  )
}
