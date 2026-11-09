import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { definirDesktop, removerMatchMedia } from '../../test/matchMedia'
import { servidor } from '../../test/servidor'
import { API, criarUsuario, daquiA, guardarSessao, renderizarLoja, responderEu, TOKEN_DE_TESTE } from '../../test/loja'

beforeEach(() => definirDesktop(true))
afterEach(() => removerMatchMedia())

async function preencherEEnviar(email: string, senha: string) {
  await userEvent.type(await screen.findByLabelText('E-mail'), email)
  await userEvent.type(screen.getByLabelText('Senha'), senha)
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
}

describe('login e sessao', () => {
  it('sem sessao, /loja leva a /loja/entrar', async () => {
    const { roteador } = renderizarLoja('/loja')

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.getByText('Área da loja')).toBeInTheDocument()
    expect(roteador.state.location.pathname).toBe('/loja/entrar')
  })

  it('login com sucesso guarda a sessao e vai para a primeira aba permitida', async () => {
    const usuario = criarUsuario({ permissoes: ['AbrirFecharLoja', 'GerenciarCardapio'] })
    servidor.use(http.post(`${API}/auth/login`, () => HttpResponse.json({ token: TOKEN_DE_TESTE, expiraEm: daquiA(3_600_000), usuario })))
    responderEu(() => usuario)
    const { roteador } = renderizarLoja('/loja/entrar')

    await preencherEEnviar('pessoa@teste.local', 'qualquer-senha')

    // a primeira, na ordem Pedidos, Hoje, Cardapio... e "Hoje" (a pessoa nao tem VerPedidos)
    expect(await screen.findByText('Hoje: em construção.')).toBeInTheDocument()
    expect(roteador.state.location.pathname).toBe('/loja/hoje')
    expect(screen.getAllByRole('tab').map((aba) => aba.textContent)).toEqual(['Hoje', 'Cardápio'])
  })

  it('o token fica so no sessionStorage: nunca em localStorage nem na URL', async () => {
    const usuario = criarUsuario({ permissoes: ['VerPedidos'] })
    servidor.use(http.post(`${API}/auth/login`, () => HttpResponse.json({ token: TOKEN_DE_TESTE, expiraEm: daquiA(3_600_000), usuario })))
    responderEu(() => usuario)
    const { roteador } = renderizarLoja('/loja/entrar')

    await preencherEEnviar('pessoa@teste.local', 'qualquer-senha')
    await screen.findByText('Pedidos: em construção.')

    expect(JSON.parse(sessionStorage.getItem('kf:sessao') ?? '{}')).toMatchObject({ token: TOKEN_DE_TESTE })
    expect(localStorage.length).toBe(0)
    expect(roteador.state.location.pathname + roteador.state.location.search + roteador.state.location.hash).not.toContain(TOKEN_DE_TESTE)
  })

  it('depois do login volta para a rota que a pessoa tentou abrir', async () => {
    const usuario = criarUsuario({ permissoes: ['VerPedidos', 'GerenciarCadastros'] })
    servidor.use(http.post(`${API}/auth/login`, () => HttpResponse.json({ token: TOKEN_DE_TESTE, expiraEm: daquiA(3_600_000), usuario })))
    responderEu(() => usuario)
    const { roteador } = renderizarLoja('/loja/cadastros')

    await preencherEEnviar('pessoa@teste.local', 'qualquer-senha')

    expect(await screen.findByText('Cadastros: em construção.')).toBeInTheDocument()
    expect(roteador.state.location.pathname).toBe('/loja/cadastros')
  })

  it('401 no login mostra a mensagem da API, limpa a senha e mantem o e-mail', async () => {
    servidor.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json({ status: 401, title: 'Não autorizado.', detail: 'E-mail ou senha inválidos, ou acesso bloqueado.' }, { status: 401 }),
      ),
    )
    renderizarLoja('/loja/entrar')

    await preencherEEnviar('pessoa@teste.local', 'senha-errada')

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos, ou acesso bloqueado.')
    expect(screen.getByLabelText('Senha')).toHaveValue('')
    expect(screen.getByLabelText('E-mail')).toHaveValue('pessoa@teste.local')
    expect(sessionStorage.getItem('kf:sessao')).toBeNull()
  })

  it('falha que nao e 401 mostra um texto fixo, sem dizer nada sobre o e-mail', async () => {
    servidor.use(http.post(`${API}/auth/login`, () => new HttpResponse(null, { status: 500 })))
    renderizarLoja('/loja/entrar')

    await preencherEEnviar('pessoa@teste.local', 'qualquer-senha')

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível entrar agora. Tente de novo.')
  })

  it('validacao no cliente: e-mail invalido e senha vazia nao chamam a API', async () => {
    const chamadas = vi.fn()
    servidor.use(http.post(`${API}/auth/login`, () => (chamadas(), HttpResponse.json({}, { status: 500 }))))
    renderizarLoja('/loja/entrar')

    await userEvent.type(await screen.findByLabelText('E-mail'), 'isso-nao-e-email')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByText('Informe um e-mail válido.')).toBeInTheDocument()
    expect(screen.getByText('Informe a senha.')).toBeInTheDocument()
    expect(chamadas).not.toHaveBeenCalled()
  })

  it('o login e o GET /auth/eu: login nao leva Authorization; /auth/eu leva o Bearer', async () => {
    const usuario = criarUsuario({ permissoes: ['VerPedidos'] })
    const cabecalhosDoLogin: Array<string | null> = []
    servidor.use(
      http.post(`${API}/auth/login`, ({ request }) => {
        cabecalhosDoLogin.push(request.headers.get('Authorization'))
        return HttpResponse.json({ token: TOKEN_DE_TESTE, expiraEm: daquiA(3_600_000), usuario })
      }),
    )
    const cabecalhosDoEu = responderEu(() => usuario)
    renderizarLoja('/loja/entrar')

    await preencherEEnviar('pessoa@teste.local', 'qualquer-senha')
    await screen.findByText('Pedidos: em construção.')

    expect(cabecalhosDoLogin).toEqual([null])
    expect(cabecalhosDoEu.length).toBeGreaterThan(0)
    expect(cabecalhosDoEu.every((cabecalho) => cabecalho === `Bearer ${TOKEN_DE_TESTE}`)).toBe(true)
  })

  it('sessao guardada e vencida: limpa e vai para o login', async () => {
    guardarSessao(daquiA(-1000))
    const { roteador } = renderizarLoja('/loja/pedidos')

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(roteador.state.location.pathname).toBe('/loja/entrar')
    expect(sessionStorage.getItem('kf:sessao')).toBeNull()
  })

  it('a sessao vence no horario de expiraEm: limpa e avisa "Sua sessão expirou"', async () => {
    guardarSessao(daquiA(400))
    responderEu(() => criarUsuario({ permissoes: ['VerPedidos'] }))
    renderizarLoja('/loja/pedidos')
    expect(await screen.findByText('Pedidos: em construção.')).toBeInTheDocument()

    expect(await screen.findByText('Sua sessão expirou. Entre de novo.', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(sessionStorage.getItem('kf:sessao')).toBeNull()
  })

  it('sessao guardada valida: carrega o usuario antes de mostrar as abas (esqueleto enquanto espera)', async () => {
    guardarSessao()
    responderEu(() => criarUsuario({ permissoes: ['VerPedidos'] }))
    renderizarLoja('/loja/pedidos')

    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(await screen.findByRole('tab', { name: 'Pedidos' })).toBeInTheDocument()
  })

  it('sair limpa a sessao e todo o cache, e volta para o login sem "sessao expirou"', async () => {
    guardarSessao()
    responderEu(() => criarUsuario({ permissoes: ['VerPedidos'] }))
    const { queryClient, roteador } = renderizarLoja('/loja/pedidos')
    await screen.findByText('Pedidos: em construção.')
    queryClient.setQueryData(['pedidos'], [{ id: 1 }])

    await userEvent.click(screen.getByRole('button', { name: /Conta de/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Sair' }))

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(roteador.state.location.pathname).toBe('/loja/entrar')
    expect(sessionStorage.getItem('kf:sessao')).toBeNull()
    expect(queryClient.getQueryData(['pedidos'])).toBeUndefined()
    expect(queryClient.getQueryCache().getAll().every((consulta) => consulta.state.data === undefined)).toBe(true)
    expect(screen.queryByText('Sua sessão expirou. Entre de novo.')).not.toBeInTheDocument()
  })
})

describe('401 e 403 em chamada protegida', () => {
  async function abrirMinhaConta(usuario = criarUsuario({ permissoes: ['VerPedidos'] })) {
    guardarSessao()
    const chamadasDoEu = responderEu(() => usuario)
    const retorno = renderizarLoja('/loja/conta')
    await screen.findByRole('heading', { name: 'Minha conta' })
    return { ...retorno, chamadasDoEu }
  }

  async function trocarSenha() {
    await userEvent.type(screen.getByLabelText('Senha atual'), 'senha-atual-1')
    await userEvent.type(screen.getByLabelText('Nova senha'), 'senha-nova-123')
    await userEvent.type(screen.getByLabelText('Confirmar nova senha'), 'senha-nova-123')
    await userEvent.click(screen.getByRole('button', { name: 'Trocar senha' }))
  }

  it('um 401 desloga com a mensagem de sessao expirada', async () => {
    servidor.use(http.post(`${API}/auth/trocar-senha`, () => HttpResponse.json({ status: 401, title: 'Não autorizado.' }, { status: 401 })))
    const { queryClient } = await abrirMinhaConta()

    await trocarSenha()

    expect(await screen.findByText('Sua sessão expirou. Entre de novo.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(sessionStorage.getItem('kf:sessao')).toBeNull()
    expect(queryClient.getQueryCache().getAll().every((consulta) => consulta.state.data === undefined)).toBe(true)
  })

  it('um 403 mostra a mensagem da API, refaz GET /auth/eu e NAO desloga', async () => {
    servidor.use(
      http.post(`${API}/auth/trocar-senha`, () =>
        HttpResponse.json({ status: 403, title: 'Proibido.', detail: 'Você não pode conceder permissões que não possui: VerPedidos.' }, { status: 403 }),
      ),
    )
    const { chamadasDoEu } = await abrirMinhaConta()
    const antes = chamadasDoEu.length

    await trocarSenha()

    expect(await screen.findAllByText('Você não pode conceder permissões que não possui: VerPedidos.')).not.toHaveLength(0)
    await waitFor(() => expect(chamadasDoEu.length).toBeGreaterThan(antes))
    expect(sessionStorage.getItem('kf:sessao')).not.toBeNull()
    expect(screen.getByRole('heading', { name: 'Minha conta' })).toBeInTheDocument()
  })

  it('403 sem detail usa "Você não tem permissão para fazer isso."', async () => {
    servidor.use(http.post(`${API}/auth/trocar-senha`, () => new HttpResponse(null, { status: 403 })))
    await abrirMinhaConta()

    await trocarSenha()

    expect((await screen.findAllByText('Você não tem permissão para fazer isso.')).length).toBeGreaterThan(0)
  })
})
