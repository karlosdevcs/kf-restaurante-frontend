import type { RouteObject } from 'react-router-dom'
import { ClienteLayout } from './ClienteProvider'
import { ConfirmacaoPage } from './ConfirmacaoPage'
import { MontarMobile } from './MontarMobile'
import { PaginaInicial } from './PaginaInicial'
import { PedidoMobile } from './PedidoMobile'

// Rotas publicas do cliente (spec, secao 7), sob um layout que guarda carrinho e formulario.
// No computador, /montar e /pedido redirecionam para a pagina unica (fase 5).
export const rotasDoCliente: RouteObject[] = [
  {
    element: <ClienteLayout />,
    children: [
      { path: '/', element: <PaginaInicial /> },
      { path: '/montar/:tamanhoId', element: <MontarMobile /> },
      { path: '/pedido', element: <PedidoMobile /> },
      { path: '/confirmacao/:numero', element: <ConfirmacaoPage /> },
    ],
  },
]
