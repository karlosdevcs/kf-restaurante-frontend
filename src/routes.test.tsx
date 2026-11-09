import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { rotas } from './routes'

function abrir(caminho: string) {
  const roteador = createMemoryRouter(rotas, { initialEntries: [caminho] })
  return render(<RouterProvider router={roteador} />)
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

  it.each(['/loja', '/loja/entrar', '/loja/pedidos', '/loja/hoje', '/loja/cardapio', '/loja/cadastros', '/loja/usuarios', '/loja/conta'])(
    'o bloco da loja carrega sob demanda: %s',
    async (caminho) => {
      abrir(caminho)

      expect(await screen.findByText(/em construção/)).toBeInTheDocument()
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
