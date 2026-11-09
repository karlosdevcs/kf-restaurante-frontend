import { useNavigate } from 'react-router-dom'
import { Banner, Button, IconeVoltar } from '../../components/ui'
import { detalheDoItem, itemEstaEsgotado } from '../../lib/carrinho'
import { formatBRL } from '../../lib/formatar'
import { CartaoDeErroDeCarga, Esqueleto, FaixaDeBloqueio } from './Estados'
import { FormularioDoPedido } from './FormularioDoPedido'
import { LinhaDoCarrinho } from './LinhaDoCarrinho'
import { useCliente } from './useCliente'
import { useDadosDoCliente } from './useDadosDoCliente'
import { useFinalizarPedido } from './useFinalizarPedido'

// Tela 3 do celular: Meu pedido (spec, 9.3). Itens, formulario e rodape com o total e o botao "Finalizar pedido".
export function PedidoMobile() {
  const navegar = useNavigate()
  const dados = useDadosDoCliente()
  const { itens, mudarQuantidade } = useCliente()
  const pedido = useFinalizarPedido(dados)

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <header className="sticky top-0 z-10 flex flex-col gap-2 border-b border-line-soft bg-white px-5 pt-4 pb-[14px]">
        <div>
          <Button variante="ghost-back" altura={36} onClick={() => navegar('/')} className="-ml-2 gap-1 px-2">
            <IconeVoltar tamanho={16} />
            Continuar escolhendo
          </Button>
        </div>
        <h1 className="text-[24px] font-extrabold">Meu pedido</h1>
      </header>

      {dados.motivoDoBloqueio ? <FaixaDeBloqueio motivo={dados.motivoDoBloqueio} /> : null}

      <main className="flex flex-1 flex-col gap-4 px-5 pt-4 pb-[18px]">
        {dados.estado === 'carregando' ? <Esqueleto className="h-[96px]" /> : null}
        {dados.estado === 'erro' ? <CartaoDeErroDeCarga aoTentarDeNovo={dados.recarregar} /> : null}

        {itens.length === 0 && dados.estado !== 'carregando' ? <p className="text-[14px] text-muted">Seu pedido vai aparecer aqui.</p> : null}

        {itens.length > 0 ? (
          <ul aria-label="Itens do pedido" className="flex flex-col gap-[10px]">
            {itens.map((item) => (
              <LinhaDoCarrinho
                key={item.chave}
                item={item}
                detalhe={detalheDoItem(item, dados.opcoesPorId)}
                esgotado={dados.estado === 'pronto' && itemEstaEsgotado(item, dados.opcoesPorId)}
                tamanho="celular"
                aoMudarQuantidade={(quantidade) => mudarQuantidade(item.chave, quantidade)}
              />
            ))}
          </ul>
        ) : null}

        <FormularioDoPedido />
      </main>

      <footer className="sticky bottom-0 flex flex-col gap-2 border-t border-line-soft bg-white px-5 pt-3 pb-[18px]">
        <div className="flex items-baseline justify-between">
          <span className="text-[14px] text-muted">Total</span>
          <span className="text-[26px] font-extrabold">{formatBRL(pedido.total)}</span>
        </div>
        {pedido.erro ? <Banner tipo="erro">{pedido.erro}</Banner> : null}
        {pedido.pendencia ? (
          <p aria-live="polite" className="text-center text-[13px] text-muted">
            {pedido.pendencia}
          </p>
        ) : null}
        <Button
          variante="primary-ink"
          altura={52}
          larguraTotal
          disabled={!pedido.podeFinalizar}
          ocupado={pedido.enviando}
          rotuloOcupado="Enviando..."
          onClick={pedido.finalizar}
        >
          Finalizar pedido
        </Button>
      </footer>
    </div>
  )
}
