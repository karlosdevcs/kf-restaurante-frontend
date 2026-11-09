import { http, HttpResponse } from 'msw'
import { servidor } from '../test/servidor'
import { ApiError, configurarAuth, ehApiError, requisitar } from './client'
import { buscarCardapioHoje } from './cardapios'
import { buscarEu, entrar } from './auth'
import { listarPedidos } from './pedidos'
import { listarTamanhos } from './tamanhos'

const API = 'http://localhost:5000'

let desfazer: () => void = () => undefined

afterEach(() => desfazer())

function registrarAuth(token: string | null = 'token-de-teste') {
  const aoNaoAutenticado = vi.fn()
  const aoProibido = vi.fn()
  desfazer = configurarAuth({ obterToken: () => token, aoNaoAutenticado, aoProibido })
  return { aoNaoAutenticado, aoProibido }
}

describe('ProblemDetails', () => {
  it('usa o detail da API como mensagem e guarda o status', async () => {
    servidor.use(
      http.post(`${API}/pedidos`, () =>
        HttpResponse.json({ title: 'Regra de negócio violada.', status: 400, detail: 'O restaurante está fechado.' }, { status: 400 }),
      ),
    )

    const erro = await requisitar('/pedidos', { metodo: 'POST', corpo: {} }).catch((e: unknown) => e)

    expect(ehApiError(erro)).toBe(true)
    expect((erro as ApiError).status).toBe(400)
    expect((erro as ApiError).message).toBe('O restaurante está fechado.')
    expect((erro as ApiError).problema?.title).toBe('Regra de negócio violada.')
  })

  it('usa um texto padrao quando a resposta de erro vem sem corpo', async () => {
    servidor.use(http.get(`${API}/qualquer`, () => new HttpResponse(null, { status: 404 })))

    const erro = (await requisitar('/qualquer').catch((e: unknown) => e)) as ApiError

    expect(erro.status).toBe(404)
    expect(erro.message).toBe('Não encontramos o que você procurou.')
  })

  it('trata corpo que nao e JSON sem quebrar', async () => {
    servidor.use(http.get(`${API}/qualquer`, () => new HttpResponse('<html>erro</html>', { status: 502 })))

    const erro = (await requisitar('/qualquer').catch((e: unknown) => e)) as ApiError

    expect(erro.status).toBe(502)
    expect(erro.message).toBe('Algo deu errado do nosso lado. Tente de novo em instantes.')
  })

  it('falha de rede vira ApiError com status 0 e mensagem propria', async () => {
    servidor.use(http.get(`${API}/qualquer`, () => HttpResponse.error()))

    const erro = (await requisitar('/qualquer').catch((e: unknown) => e)) as ApiError

    expect(erro.rede).toBe(true)
    expect(erro.status).toBe(0)
    expect(erro.message).toMatch(/Não foi possível falar com o servidor/)
  })

  it('resposta 204 devolve undefined', async () => {
    servidor.use(http.post(`${API}/pedidos/1/enviado`, () => new HttpResponse(null, { status: 204 })))

    await expect(requisitar('/pedidos/1/enviado', { metodo: 'POST' })).resolves.toBeUndefined()
  })
})

describe('token so vai nas chamadas da loja', () => {
  it('chamada autenticada leva Authorization: Bearer', async () => {
    registrarAuth('abc123')
    let cabecalho: string | null = null
    servidor.use(
      http.get(`${API}/auth/eu`, ({ request }) => {
        cabecalho = request.headers.get('authorization')
        return HttpResponse.json({ id: 1, nome: 'Ana', email: 'a@a.com', papel: 'Dono', ativo: true, permissoes: [] })
      }),
    )

    await buscarEu()

    expect(cabecalho).toBe('Bearer abc123')
  })

  it('chamadas do cliente e o login NUNCA levam Authorization, mesmo com sessao ativa', async () => {
    registrarAuth('abc123')
    const cabecalhos: Record<string, string | null> = {}
    servidor.use(
      http.get(`${API}/tamanhos`, ({ request }) => {
        cabecalhos.tamanhos = request.headers.get('authorization')
        return HttpResponse.json([])
      }),
      http.get(`${API}/cardapios/hoje`, ({ request }) => {
        cabecalhos.cardapio = request.headers.get('authorization')
        return HttpResponse.json({ id: 1, dataPublicacao: '2026-11-09', situacao: 'Publicado', opcoes: [] })
      }),
      http.post(`${API}/auth/login`, ({ request }) => {
        cabecalhos.login = request.headers.get('authorization')
        return HttpResponse.json({ token: 't', expiraEm: '2026-11-10T00:00:00Z', usuario: {} })
      }),
    )

    await listarTamanhos()
    await buscarCardapioHoje()
    await entrar({ email: 'a@a.com', senha: 'x' })

    expect(cabecalhos).toEqual({ tamanhos: null, cardapio: null, login: null })
  })

  it('sem token na sessao, a chamada autenticada segue sem cabecalho (a API responde 401)', async () => {
    registrarAuth(null)
    let cabecalho: string | null = 'nao-chamou'
    servidor.use(
      http.get(`${API}/pedidos`, ({ request }) => {
        cabecalho = request.headers.get('authorization')
        return HttpResponse.json([])
      }),
    )

    await listarPedidos()

    expect(cabecalho).toBeNull()
  })
})

describe('401 e 403 nas chamadas da loja', () => {
  it('401 em chamada autenticada avisa o gancho de nao autenticado', async () => {
    const { aoNaoAutenticado, aoProibido } = registrarAuth()
    servidor.use(http.get(`${API}/pedidos`, () => HttpResponse.json({ status: 401, title: 'Unauthorized' }, { status: 401 })))

    const erro = (await listarPedidos().catch((e: unknown) => e)) as ApiError

    expect(erro.status).toBe(401)
    expect(aoNaoAutenticado).toHaveBeenCalledOnce()
    expect(aoProibido).not.toHaveBeenCalled()
  })

  it('403 em chamada autenticada avisa o gancho de proibido, sem tratar como sessao vencida', async () => {
    const { aoNaoAutenticado, aoProibido } = registrarAuth()
    servidor.use(http.get(`${API}/pedidos`, () => HttpResponse.json({ status: 403, title: 'Forbidden' }, { status: 403 })))

    const erro = (await listarPedidos().catch((e: unknown) => e)) as ApiError

    expect(erro.status).toBe(403)
    expect(aoProibido).toHaveBeenCalledOnce()
    expect(aoNaoAutenticado).not.toHaveBeenCalled()
  })

  it('401 no login (chamada aberta) e credencial errada: NAO dispara o gancho de sessao vencida', async () => {
    const { aoNaoAutenticado } = registrarAuth()
    servidor.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json({ status: 401, detail: 'E-mail ou senha inválidos, ou acesso bloqueado.' }, { status: 401 }),
      ),
    )

    const erro = (await entrar({ email: 'a@a.com', senha: 'errada' }).catch((e: unknown) => e)) as ApiError

    expect(erro.message).toBe('E-mail ou senha inválidos, ou acesso bloqueado.')
    expect(aoNaoAutenticado).not.toHaveBeenCalled()
  })
})

describe('cardapio de hoje', () => {
  it('404 vira null (nao publicado ainda), nao erro', async () => {
    servidor.use(http.get(`${API}/cardapios/hoje`, () => HttpResponse.json({ status: 404, detail: 'ainda não foi publicado' }, { status: 404 })))

    await expect(buscarCardapioHoje()).resolves.toBeNull()
  })

  it('outros erros continuam erros', async () => {
    servidor.use(http.get(`${API}/cardapios/hoje`, () => HttpResponse.json({ status: 500 }, { status: 500 })))

    await expect(buscarCardapioHoje()).rejects.toBeInstanceOf(ApiError)
  })
})

describe('consulta', () => {
  it('serializa os filtros e ignora vazios', async () => {
    let url = ''
    servidor.use(
      http.get(`${API}/pedidos`, ({ request }) => {
        url = request.url
        return HttpResponse.json([])
      }),
    )

    await listarPedidos({ data: '2026-11-08', status: 'Gerado' })
    expect(new URL(url).searchParams.get('data')).toBe('2026-11-08')
    expect(new URL(url).searchParams.get('status')).toBe('Gerado')

    await listarPedidos({})
    expect(new URL(url).search).toBe('')
  })
})
