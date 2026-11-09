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

export const rotas: RouteObject[] = [...rotasDoCliente, rotaDaLoja, { path: '*', element: <NaoEncontrada /> }]

export function criarRoteador() {
  return createBrowserRouter(rotas)
}
