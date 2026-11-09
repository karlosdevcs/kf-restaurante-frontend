import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { buscarCardapioHoje, buscarRestaurante, listarTamanhos } from '../api'
import { CarrinhoProvider } from '../carrinho/CarrinhoContext'
import { useCarrinho } from '../carrinho/useCarrinho'
import { BotaoPrincipal, Carregando, ErroInline } from '../components/Feedback'
import { Logo } from '../components/Logo'
import type { CardapioDoDia, Pedido, Restaurante, TamanhoMarmita } from '../types/api'
import { formatarMoeda, mensagemDeErro } from '../utils/formatar'
import { CardapioSection } from './CardapioSection'
import { CarrinhoSection } from './CarrinhoSection'
import { ConfirmacaoSection } from './ConfirmacaoSection'
import { FechadoHoje } from './FechadoHoje'
import { MontarMarmitaSection } from './MontarMarmitaSection'

type Passo = 'cardapio' | 'marmita' | 'carrinho'

interface Dados {
  cardapio: CardapioDoDia | null
  restaurante: Restaurante
  tamanhos: TamanhoMarmita[]
}

function Pagina() {
  const [dados, setDados] = useState<Dados | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [passo, setPasso] = useState<Passo>('cardapio')
  const [tamanho, setTamanho] = useState<TamanhoMarmita | null>(null)
  const [pedidoCriado, setPedidoCriado] = useState<Pedido | null>(null)
  const { itens, total, quantidadeTotal } = useCarrinho()

  const carregar = useCallback(async () => {
    setErro(null)
    try {
      const [cardapio, restaurante, tamanhos] = await Promise.all([buscarCardapioHoje(), buscarRestaurante(), listarTamanhos()])
      setDados({ cardapio, restaurante, tamanhos })
    } catch (e) {
      setErro(mensagemDeErro(e))
    }
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar])

  if (erro) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
        <ErroInline mensagem={`Não foi possível carregar o cardápio. ${erro}`} />
        <BotaoPrincipal onClick={() => void carregar()}>Tentar de novo</BotaoPrincipal>
      </div>
    )
  }

  if (!dados) return <Carregando />

  const { cardapio, restaurante, tamanhos } = dados

  if (pedidoCriado) {
    return (
      <div className="px-4 py-6">
        <ConfirmacaoSection
          pedido={pedidoCriado}
          onNovoPedido={() => {
            setPedidoCriado(null)
            setPasso('cardapio')
          }}
        />
      </div>
    )
  }

  if (!restaurante.aberto) return <FechadoHoje motivo="loja-fechada" />
  if (!cardapio) return <FechadoHoje motivo="sem-cardapio" />
  if (cardapio.situacao === 'Fechado') return <FechadoHoje motivo="encerrado" />

  // no desktop o carrinho fica sempre ao lado; no mobile ele e uma tela propria (passo "carrinho")
  const mostrandoCarrinhoNoMobile = passo === 'carrinho'

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 md:pb-10 md:pt-8">
      <div className="md:grid md:grid-cols-[1fr_380px] md:gap-10">
        <main className={mostrandoCarrinhoNoMobile ? 'hidden md:block' : ''}>
          {passo === 'marmita' && tamanho ? (
            <MontarMarmitaSection
              cardapio={cardapio}
              tamanho={tamanho}
              onVoltar={() => setPasso('cardapio')}
              onAdicionada={() => setPasso('cardapio')}
            />
          ) : (
            <CardapioSection
              cardapio={cardapio}
              tamanhos={tamanhos}
              onEscolherTamanho={(t) => {
                setTamanho(t)
                setPasso('marmita')
              }}
            />
          )}
        </main>

        <aside className={mostrandoCarrinhoNoMobile ? 'block' : 'hidden md:block'}>
          <div className="md:sticky md:top-20 md:rounded-xl md:border md:border-borda-leve md:p-5">
            {mostrandoCarrinhoNoMobile && (
              <button type="button" onClick={() => setPasso('cardapio')} className="mb-3 text-sm font-semibold text-texto-secundario md:hidden">
                ← Continuar escolhendo
              </button>
            )}
            <CarrinhoSection cardapio={cardapio} onPedidoCriado={setPedidoCriado} />
          </div>
        </aside>
      </div>

      {/* barra do mobile: leva ao carrinho (no desktop o carrinho ja esta visivel) */}
      {!mostrandoCarrinhoNoMobile && itens.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 border-t border-borda-leve bg-white p-4 md:hidden">
          <BotaoPrincipal onClick={() => setPasso('carrinho')}>
            Ver pedido ({quantidadeTotal}) · {formatarMoeda(total)}
          </BotaoPrincipal>
        </div>
      )}
    </div>
  )
}

export function ClientePage() {
  return (
    <CarrinhoProvider>
      <div className="min-h-full bg-white">
        <header className="sticky top-0 z-10 border-b border-borda-leve bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Logo />
            <Link to="/loja" className="text-sm font-semibold text-texto-terciario hover:text-texto-principal">
              Área da loja
            </Link>
          </div>
        </header>
        <Pagina />
      </div>
    </CarrinhoProvider>
  )
}
