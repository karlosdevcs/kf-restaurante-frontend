import type { RouteObject } from 'react-router-dom'
import { ClienteLayout } from './ClienteProvider'
import { ConfirmacaoPage } from './ConfirmacaoPage'
import { PaginaInicial, RotaMontar, RotaPedido } from './PaginaInicial'

// Rotas publicas do cliente (spec, secao 7), sob um layout que guarda carrinho e formulario.
// No computador, /montar e /pedido redirecionam para a pagina unica.
export const rotasDoCliente: RouteObject[] = [
  {
    element: <ClienteLayout />,
    children: [
      { path: '/', element: <PaginaInicial /> },
      { path: '/montar/:tamanhoId', element: <RotaMontar /> },
      { path: '/pedido', element: <RotaPedido /> },
      { path: '/confirmacao/:numero', element: <ConfirmacaoPage /> },
    ],
  },
]
