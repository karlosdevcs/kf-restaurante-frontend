import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import indexHtml from '../index.html?raw'
import type { Permissao } from './api/tipos'
import { servirCadastros } from './test/cadastros'
import { servirCliente } from './test/cliente'
import { criarUsuario, guardarSessao, renderizarApp, responderEu } from './test/loja'
import { definirDesktop, removerMatchMedia } from './test/matchMedia'
import { servirLoja } from './test/pedidos'
import { servidor } from './test/servidor'
import { servirUsuarios, usuario } from './test/usuarios'

afterEach(() => removerMatchMedia())

const API = 'http://localhost:5000'

async function abrirLoja(caminho: string, permissoes: Permissao[], desktop: boolean, papel: 'Funcionario' | 'Dono' = 'Funcionario') {
  definirDesktop(desktop)
  guardarSessao()
  responderEu(() => criarUsuario({ id: 1, nome: 'Pessoa Teste', papel, permissoes }))
  return renderizarApp(caminho)
}

describe('idioma e titulo por rota (spec, 15.9)', () => {
  it('index.html declara pt-BR', () => {
    expect(indexHtml).toContain('<html lang="pt-BR">')
  })

  it.each([
    ['/', 'KF Restaurante'],
    ['/loja/entrar', 'Entrar · KF Restaurante'],
    ['/rota-que-nao-existe', 'Página não encontrada · KF Restaurante'],
  ])('titulo de %s', async (caminho, titulo) => {
    servirCliente()
    renderizarApp(caminho)

    await waitFor(() => expect(document.title).toBe(titulo))
  })

  it('area da loja: "Painel da loja · KF Restaurante"', async () => {
    servirLoja()
    await abrirLoja('/loja/pedidos', ['VerPedidos'], true)

    await waitFor(() => expect(document.title).toBe('Painel da loja · KF Restaurante'))
  })
})

describe('foco ao trocar de tela (spec, 15.7)', () => {
  it('celular, cliente: ao ir do cardapio para a montagem, o foco vai para o titulo da tela nova', async () => {
    servirCliente()
    definirDesktop(false)
    renderizarApp('/')
    await userEvent.click(await screen.findByRole('button', { name: 'Montar minha marmita' }))

    const titulo = await screen.findByRole('heading', { level: 1, name: 'Marmita M' })

    await waitFor(() => expect(titulo).toHaveFocus())
    expect(titulo).toHaveAttribute('tabindex', '-1')
  })

  it('a primeira tela da pagina nao rouba o foco do navegador', async () => {
    servirCliente()
    definirDesktop(false)
    renderizarApp('/montar/2')

    await screen.findByRole('heading', { level: 1, name: 'Marmita M' })

    expect(document.body).toHaveFocus()
  })

  it('celular, loja: trocar de aba na barra do rodape leva o foco ao titulo da aba nova', async () => {
    servirLoja()
    await abrirLoja('/loja/pedidos', ['VerPedidos', 'AbrirFecharLoja'], false)
    await screen.findByRole('heading', { name: 'Pedidos de hoje' })
    const barra = screen.getByRole('navigation', { name: 'Seções da loja' })

    await userEvent.click(within(barra).getByRole('button', { name: 'Hoje' }))

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Hoje' })).toHaveFocus())
  })

  it('computador: o foco fica na aba (a troca de aba nao o tira do tablist)', async () => {
    servirLoja()
    await abrirLoja('/loja/pedidos', ['VerPedidos', 'AbrirFecharLoja'], true)
    await screen.findByRole('heading', { name: 'Pedidos de hoje' })

    await userEvent.click(screen.getByRole('tab', { name: 'Hoje' }))

    expect(await screen.findByRole('heading', { name: 'Hoje' })).not.toHaveFocus()
    expect(screen.getByRole('tab', { name: 'Hoje' })).toHaveFocus()
  })

  it('formularios abrem com o foco no primeiro campo: nova opcao, novo tamanho e novo usuario', async () => {
    servirLoja()
    servirCadastros()
    servirUsuarios({ usuarios: [usuario(1, 'Pessoa Teste', { papel: 'Dono' })] })
    await abrirLoja('/loja/cadastros', ['GerenciarCadastros'], true, 'Dono')
    await screen.findByRole('heading', { name: 'Opções' })

    await userEvent.click(screen.getByRole('button', { name: 'Nova opção' }))
    expect(within(screen.getByRole('form', { name: 'Nova opção' })).getByLabelText('Nome')).toHaveFocus()

    await userEvent.click(screen.getByRole('button', { name: 'Novo tamanho' }))
    expect(within(screen.getByRole('form', { name: 'Novo tamanho' })).getByLabelText('Nome')).toHaveFocus()

    await userEvent.click(screen.getByRole('tab', { name: 'Usuários' }))
    await screen.findByRole('heading', { name: 'Usuários' })
    await userEvent.click(screen.getByRole('button', { name: 'Novo usuário' }))
    expect(within(screen.getByRole('form', { name: 'Novo usuário' })).getByLabelText('Nome')).toHaveFocus()
  })
})

describe('semantica e anuncios (spec, 15.6)', () => {
  it('computador: abas com tablist, tab e tabpanel; celular: nav "Seções da loja"', async () => {
    servirLoja()
    const { unmount } = await abrirLoja('/loja/pedidos', ['VerPedidos', 'AbrirFecharLoja'], true)
    await screen.findByRole('heading', { name: 'Pedidos de hoje' })
    expect(screen.getByRole('tablist', { name: 'Seções da loja' })).toBeInTheDocument()
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'aba-pedidos')
    unmount()

    await abrirLoja('/loja/pedidos', ['VerPedidos', 'AbrirFecharLoja'], false)
    await screen.findByRole('heading', { name: 'Pedidos de hoje' })
    expect(screen.getByRole('navigation', { name: 'Seções da loja' })).toBeInTheDocument()
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
  })

  it('mudanca de aba por falta de permissao e anunciada em regiao aria-live', async () => {
    servirLoja()
    servirCadastros()
    definirDesktop(true)
    guardarSessao()
    let permissoes: Permissao[] = ['VerPedidos', 'GerenciarCadastros']
    responderEu(() => criarUsuario({ permissoes }))
    renderizarApp('/loja/cadastros')
    await screen.findByRole('heading', { name: 'Opções' })

    permissoes = ['VerPedidos']
    act(() => {
      document.dispatchEvent(new Event('visibilitychange', { bubbles: true }))
    })

    expect(await screen.findByRole('heading', { name: 'Pedidos de hoje' })).toBeInTheDocument()
    const regioes = screen.getAllByRole('status').filter((no) => no.getAttribute('aria-live') === 'polite')
    expect(regioes.map((no) => no.textContent)).toContain('Você não tem acesso a esta área. Abrimos Pedidos.')
  })

  it('erro de formulario e anunciado: mensagem de campo com role=alert', async () => {
    servirCliente()
    definirDesktop(false)
    renderizarApp('/')
    await userEvent.click(await screen.findByRole('button', { name: 'Adicionar Bebida 1' }))
    await userEvent.click(screen.getByRole('button', { name: /Ver pedido/ }))
    await userEvent.click(await screen.findByRole('button', { name: 'Entrega' }))

    // a pendencia aparece numa regiao aria-live acima do botao
    const pendencia = await screen.findByText('Preencha seu nome pra finalizar')
    expect(pendencia).toHaveAttribute('aria-live', 'polite')
  })
})

describe('estados de erro das listas da loja (spec, 14)', () => {
  it.each([
    ['/loja/cadastros', ['GerenciarCadastros'], `${API}/opcoes`, 'Opções'],
    ['/loja/usuarios', [], `${API}/usuarios`, 'Usuários'],
  ] as Array<[string, Permissao[], string, string]>)('%s: falha ao carregar mostra "Não foi possível carregar" e "Tentar de novo" recarrega', async (caminho, permissoes, url, titulo) => {
    servirLoja()
    servirCadastros()
    let falhar = true
    servidor.use(http.get(url, () => (falhar ? new HttpResponse(null, { status: 500 }) : HttpResponse.json([]))))
    await abrirLoja(caminho, permissoes, true, caminho.endsWith('usuarios') ? 'Dono' : 'Funcionario')
    await screen.findByRole('heading', { name: titulo })

    expect(await screen.findByText('Não foi possível carregar')).toBeInTheDocument()

    falhar = false
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))

    await waitFor(() => expect(screen.queryByText('Não foi possível carregar')).not.toBeInTheDocument())
  })
})
