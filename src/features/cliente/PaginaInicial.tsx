import { Navigate, useParams } from 'react-router-dom'
import { useIsDesktop } from '../../lib/useIsDesktop'
import { CardapioMobile } from './CardapioMobile'
import { MontarMobile } from './MontarMobile'
import { PaginaDesktop } from './PaginaDesktop'
import { PedidoMobile } from './PedidoMobile'

// O layout e ESCOLHIDO pelo hook useIsDesktop (1024px), nao por quebra de CSS (spec, secao 7).

// `/`: computador = pagina unica; celular = tela 1 (Cardapio)
export function PaginaInicial() {
  return useIsDesktop() ? <PaginaDesktop /> : <CardapioMobile />
}

// `/montar/:tamanhoId`: no computador volta para a pagina unica, ja com o tamanho escolhido
export function RotaMontar() {
  const { tamanhoId } = useParams()
  const desktop = useIsDesktop()

  if (desktop) return <Navigate to={tamanhoId ? `/?tamanho=${encodeURIComponent(tamanhoId)}` : '/'} replace />
  return <MontarMobile />
}

// `/pedido`: no computador o formulario fica no carrinho lateral
export function RotaPedido() {
  return useIsDesktop() ? <Navigate to="/" replace /> : <PedidoMobile />
}
