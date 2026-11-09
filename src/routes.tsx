import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { NaoEncontrada } from './features/NaoEncontrada'
import { rotasDoCliente } from './features/cliente/rotasDoCliente'

// Todo o bloco /loja/* e lazy: o cliente nao baixa o painel nem a logica de login (spec, seção 7).
const rotaDaLoja: RouteObject = {
  path: '/loja/*',
  lazy: async () => {
    const { LojaApp } = await import('./features/loja/LojaApp')
    return { Component: LojaApp }
  },
}

// Catalogo interno de componentes: SO em desenvolvimento. Em producao esta condicao vira `false` e o
// bundler descarta a rota junto com o codigo do catalogo.
const rotasDeDesenvolvimento: RouteObject[] = import.meta.env.DEV
  ? [
      {
        path: '/_ui',
        lazy: async () => {
          const { CatalogoUi } = await import('./features/catalogo/CatalogoUi')
          return { Component: CatalogoUi }
        },
      },
    ]
  : []

export const rotas: RouteObject[] = [...rotasDoCliente, rotaDaLoja, ...rotasDeDesenvolvimento, { path: '*', element: <NaoEncontrada /> }]

export function criarRoteador() {
  return createBrowserRouter(rotas)
}
