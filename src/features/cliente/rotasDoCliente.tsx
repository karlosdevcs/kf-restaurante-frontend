import type { RouteObject } from 'react-router-dom'
import { Pendente } from '../Pendente'

// FASE 1: rotas vazias. As telas reais entram nas fases 4 (celular) e 5 (computador).
// Rotas publicas do cliente (spec, seção 7). No computador, /montar e /pedido redirecionam para a pagina unica.
export const rotasDoCliente: RouteObject[] = [
  { path: '/', element: <Pendente nome="Cardápio" /> },
  { path: '/montar/:tamanhoId', element: <Pendente nome="Montar marmita" /> },
  { path: '/pedido', element: <Pendente nome="Meu pedido" /> },
  { path: '/confirmacao/:numero', element: <Pendente nome="Confirmação" /> },
]
