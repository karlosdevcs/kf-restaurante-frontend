import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { definirDesktop, removerMatchMedia } from '../../test/matchMedia'
import { criarUsuario, guardarSessao, renderizarLoja, responderEu } from '../../test/loja'
import type { Papel, Permissao } from '../../api/tipos'
import { abasPermitidas, primeiraAbaPermitida, rotuloDaPermissao, rotuloDoPapel } from '../../lib/permissoes'

beforeEach(() => definirDesktop(true))
afterEach(() => removerMatchMedia())

async function abrirComo(papel: Papel, permissoes: Permissao[], caminho = '/loja') {
  guardarSessao()
  responderEu(() => criarUsuario({ papel, permissoes }))
  return renderizarLoja(caminho)
}

function nomesDasAbas() {
  return screen.queryAllByRole('tab').map((aba) => aba.textContent)
}

describe('abas por permissao', () => {
  it.each([
    ['VerPedidos', ['Pedidos']],
    ['AbrirFecharLoja', ['Hoje']],
    ['EsgotarOpcoes', ['Hoje']],
    ['AlterarWhatsApp', ['Hoje']],
    ['GerenciarCardapio', ['Cardápio']],
    ['GerenciarCadastros', ['Cadastros']],
  ] as const)('%s libera as abas %j', async (permissao, esperado) => {
    await abrirComo('Funcionario', [permissao])

    await screen.findByRole('tablist')
    expect(nomesDasAbas()).toEqual(esperado)
  })

  it('a aba Usuarios aparece so para Dono e Superuser, mesmo sem nenhuma permissao', async () => {
    const { unmount } = await abrirComo('Dono', [])
    await screen.findByRole('tablist')
    expect(nomesDasAbas()).toEqual(['Usuários'])
    unmount()

    await abrirComo('Superuser', [])
    await screen.findByRole('tablist')
    expect(nomesDasAbas()).toEqual(['Usuários'])
  })

  it('ordem fixa: Pedidos, Hoje, Cardapio, Cadastros, Usuarios', async () => {
    await abrirComo('Dono', ['GerenciarCadastros', 'VerPedidos', 'GerenciarCardapio', 'AbrirFecharLoja'])

    await screen.findByRole('tablist')
    expect(nomesDasAbas()).toEqual(['Pedidos', 'Hoje', 'Cardápio', 'Cadastros', 'Usuários'])
  })

  it('/loja vai para a primeira aba permitida', async () => {
    const { roteador } = await abrirComo('Funcionario', ['GerenciarCadastros', 'GerenciarCardapio'])

    expect(await screen.findByText('Cardápio: em construção.')).toBeInTheDocument()
    expect(roteador.state.location.pathname).toBe('/loja/cardapio')
  })

  it('abrir uma aba sem permissao leva para a primeira permitida', async () => {
    const { roteador } = await abrirComo('Funcionario', ['VerPedidos'], '/loja/usuarios')

    expect(await screen.findByRole('heading', { name: 'Pedidos de hoje' })).toBeInTheDocument()
    expect(roteador.state.location.pathname).toBe('/loja/pedidos')
  })

  it('funcionario sem permissoes: nenhuma aba e o cartao "sem acesso" com Minha conta e Sair', async () => {
    await abrirComo('Funcionario', [])

    expect(await screen.findByText('Você ainda não tem acesso a nada por aqui')).toBeInTheDocument()
    expect(screen.getByText('Peça ao dono da loja para liberar as suas permissões.')).toBeInTheDocument()
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Minha conta' })).toHaveAttribute('href', '/loja/conta')
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('funcionario sem permissoes que abre uma aba cai no "sem acesso", sem laco de redirecionamento', async () => {
    const { roteador } = await abrirComo('Funcionario', [], '/loja/pedidos')

    expect(await screen.findByText('Você ainda não tem acesso a nada por aqui')).toBeInTheDocument()
    expect(roteador.state.location.pathname).toBe('/loja')
  })

  it('mudar as permissoes na API reflete nas abas depois de refazer o GET /auth/eu', async () => {
    guardarSessao()
    let permissoes: Permissao[] = ['VerPedidos', 'GerenciarCardapio']
    responderEu(() => criarUsuario({ permissoes }))
    const { roteador } = renderizarLoja('/loja/cardapio')
    await screen.findByText('Cardápio: em construção.')
    expect(nomesDasAbas()).toEqual(['Pedidos', 'Cardápio'])

    permissoes = ['VerPedidos']
    act(() => {
      document.dispatchEvent(new Event('visibilitychange', { bubbles: true })) // a pessoa voltou para a janela
    })

    // a aba atual deixou de ser permitida: vai para a primeira permitida
    await waitFor(() => expect(nomesDasAbas()).toEqual(['Pedidos']))
    expect(await screen.findByRole('heading', { name: 'Pedidos de hoje' })).toBeInTheDocument()
    expect(roteador.state.location.pathname).toBe('/loja/pedidos')
  })

  it('permissao desconhecida nao quebra a tela e aparece com o proprio nome', async () => {
    await abrirComo('Funcionario', ['VerPedidos', 'PermissaoDoFuturo'], '/loja/conta')

    expect(await screen.findByRole('heading', { name: 'Minha conta' })).toBeInTheDocument()
    expect(screen.getByText('Ver pedidos')).toBeInTheDocument()
    expect(screen.getByText('PermissaoDoFuturo')).toBeInTheDocument()
    expect(nomesDasAbas()).toEqual(['Pedidos'])
  })
})

describe('menu do usuario', () => {
  it('mostra nome, e-mail e papel; abre Minha conta e fecha com Esc devolvendo o foco', async () => {
    guardarSessao()
    responderEu(() => criarUsuario({ nome: 'Ana Souza', email: 'ana@teste.local', papel: 'Dono', permissoes: ['VerPedidos'] }))
    renderizarLoja('/loja/pedidos')
    await screen.findByRole('heading', { name: 'Pedidos de hoje' })

    const gatilho = screen.getByRole('button', { name: 'Conta de Ana Souza' })
    expect(gatilho).toHaveAttribute('aria-expanded', 'false')
    expect(gatilho).toHaveTextContent('AS')

    await userEvent.click(gatilho)
    const menu = screen.getByRole('group', { name: 'Menu da conta' })
    expect(menu).toHaveTextContent('ana@teste.local')
    expect(menu).toHaveTextContent('Dono')

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('group', { name: 'Menu da conta' })).not.toBeInTheDocument()
    expect(gatilho).toHaveFocus()

    await userEvent.click(gatilho)
    await userEvent.click(screen.getByRole('button', { name: 'Minha conta' }))
    expect(await screen.findByRole('heading', { name: 'Minha conta' })).toBeInTheDocument()
  })

  it('fecha ao clicar fora', async () => {
    guardarSessao()
    responderEu(() => criarUsuario({ permissoes: ['VerPedidos'] }))
    renderizarLoja('/loja/pedidos')
    await screen.findByRole('heading', { name: 'Pedidos de hoje' })

    await userEvent.click(screen.getByRole('button', { name: /Conta de/ }))
    expect(screen.getByRole('group', { name: 'Menu da conta' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('heading', { name: 'Pedidos de hoje' }))
    expect(screen.queryByRole('group', { name: 'Menu da conta' })).not.toBeInTheDocument()
  })
})

describe('mapa de rotulos e abas (lib/permissoes)', () => {
  it('rotulos conhecidos e fallback para o nome tecnico', () => {
    expect(rotuloDaPermissao('AbrirFecharLoja')).toBe('Abrir e fechar a loja')
    expect(rotuloDaPermissao('Nova')).toBe('Nova')
    expect(rotuloDoPapel('Funcionario')).toBe('Funcionário')
    expect(rotuloDoPapel('Outro')).toBe('Outro')
  })

  it('abasPermitidas e primeiraAbaPermitida seguem a regra da secao 10.5', () => {
    expect(abasPermitidas({ papel: 'Funcionario', permissoes: [] })).toEqual([])
    expect(primeiraAbaPermitida({ papel: 'Funcionario', permissoes: [] })).toBeNull()
    expect(primeiraAbaPermitida({ papel: 'Dono', permissoes: ['EsgotarOpcoes'] })?.id).toBe('hoje')
  })
})
