import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { criarQueryClient } from './api/queryClient'
import { rotas } from './routes'

function abrir(caminho: string) {
  const roteador = createMemoryRouter(rotas, { initialEntries: [caminho] })
  return render(
    <QueryClientProvider client={criarQueryClient()}>
      <RouterProvider router={roteador} />
    </QueryClientProvider>,
  )
}

describe('rotas', () => {
  it('rota desconhecida mostra "Página não encontrada" com link para a home', async () => {
    abrir('/isso-nao-existe')

    expect(await screen.findByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Voltar para o cardápio/ })).toHaveAttribute('href', '/')
  })

  it.each([
    ['/', 'Cardápio'],
    ['/montar/2', 'Montar marmita'],
    ['/pedido', 'Meu pedido'],
    ['/confirmacao/14', 'Confirmação'],
  ])('rota publica do cliente %s existe', async (caminho, nome) => {
    abrir(caminho)

    expect(await screen.findByText(`${nome}: em construção.`)).toBeInTheDocument()
  })

  it('/loja/entrar abre a tela de login (bloco carregado sob demanda)', async () => {
    abrir('/loja/entrar')

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
  })

  it.each(['/loja', '/loja/pedidos', '/loja/hoje', '/loja/cardapio', '/loja/cadastros', '/loja/usuarios', '/loja/conta'])(
    'sem sessao, %s leva ao login',
    async (caminho) => {
      abrir(caminho)

      expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    },
  )

  it('o catalogo /_ui existe em desenvolvimento e mostra os componentes', async () => {
    abrir('/_ui')

    expect(await screen.findByRole('heading', { name: 'Catálogo de componentes' })).toBeInTheDocument()
    // um estado de cada familia de atomo
    expect(screen.getAllByRole('button', { name: 'Loja aberta. Clicar para fechar' }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole('tab').length).toBeGreaterThan(0)
    expect(screen.getByRole('checkbox', { name: 'Item marcável' })).toBeInTheDocument()
    expect(screen.getAllByRole('alert').map((no) => no.textContent)).toContain('Mensagem de erro (role=alert)')
  })
})
