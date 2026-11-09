import type { ProblemaApi } from './tipos'

// sem .env, cai no endereco padrao da API em desenvolvimento. Variaveis VITE_* vao para o navegador: nunca segredo.
const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000').replace(/\/+$/, '')

const MENSAGEM_DE_REDE = 'Não foi possível falar com o servidor. Verifique a conexão e tente de novo.'

const MENSAGEM_POR_STATUS: Record<number, string> = {
  400: 'A requisição não foi aceita.',
  401: 'Você precisa entrar para continuar.',
  403: 'Você não tem permissão para fazer isso.',
  404: 'Não encontramos o que você procurou.',
  409: 'Já existe um registro com esses dados.',
}

// Erro de qualquer resposta que nao seja 2xx, ou de falta de resposta (status 0, `rede` verdadeiro).
// `message` ja e legivel para mostrar a pessoa: usa o `detail` da API e cai num texto padrao se ele faltar.
export class ApiError extends Error {
  readonly status: number
  readonly problema: ProblemaApi | null
  readonly rede: boolean

  constructor(status: number, problema: ProblemaApi | null, rede = false) {
    super(
      rede
        ? MENSAGEM_DE_REDE
        : (problema?.detail ??
            MENSAGEM_POR_STATUS[status] ??
            (status >= 500 ? 'Algo deu errado do nosso lado. Tente de novo em instantes.' : `Erro ${status}.`)),
    )
    this.name = 'ApiError'
    this.status = status
    this.problema = problema
    this.rede = rede
  }
}

export function ehApiError(erro: unknown): erro is ApiError {
  return erro instanceof ApiError
}

// ---------- ganchos de autenticacao ----------
// O client nao conhece sessao. Quem conhece (o AuthProvider) se registra aqui e decide o que fazer com 401 e 403.

export interface GanchosDeAuth {
  obterToken: () => string | null
  aoNaoAutenticado: (erro: ApiError) => void
  aoProibido: (erro: ApiError) => void
}

const GANCHOS_VAZIOS: GanchosDeAuth = {
  obterToken: () => null,
  aoNaoAutenticado: () => undefined,
  aoProibido: () => undefined,
}

let ganchos: GanchosDeAuth = GANCHOS_VAZIOS

// devolve a funcao que desfaz o registro (para o AuthProvider limpar ao desmontar)
export function configurarAuth(novos: Partial<GanchosDeAuth>): () => void {
  ganchos = { ...ganchos, ...novos }
  return () => {
    ganchos = GANCHOS_VAZIOS
  }
}

// ---------- requisicao ----------

type Valor = string | number | boolean | null | undefined

export interface OpcoesDaRequisicao {
  metodo?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  corpo?: unknown
  consulta?: Record<string, Valor>
  /**
   * `true` so nas chamadas da LOJA: anexa o token e passa 401 e 403 para os ganchos.
   * As chamadas do cliente e o login ficam em `false` e NUNCA levam o cabecalho Authorization.
   */
  autenticada?: boolean
  sinal?: AbortSignal
}

function montarUrl(caminho: string, consulta?: Record<string, Valor>): string {
  const url = new URL(BASE_URL + caminho)

  for (const [chave, valor] of Object.entries(consulta ?? {})) {
    if (valor !== undefined && valor !== null && valor !== '') {
      url.searchParams.set(chave, String(valor))
    }
  }

  return url.toString()
}

function lerJson(texto: string): unknown {
  if (texto === '') return null

  try {
    return JSON.parse(texto)
  } catch {
    return null
  }
}

export async function requisitar<T>(caminho: string, opcoes: OpcoesDaRequisicao = {}): Promise<T> {
  const { metodo = 'GET', corpo, consulta, autenticada = false, sinal } = opcoes

  const cabecalhos: Record<string, string> = { Accept: 'application/json' }
  if (corpo !== undefined) cabecalhos['Content-Type'] = 'application/json'

  if (autenticada) {
    const token = ganchos.obterToken()
    if (token) cabecalhos['Authorization'] = `Bearer ${token}`
  }

  let resposta: Response
  try {
    resposta = await fetch(montarUrl(caminho, consulta), {
      method: metodo,
      headers: cabecalhos,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
      signal: sinal,
    })
  } catch (erro) {
    // cancelamento (o TanStack Query cancela consultas obsoletas) nao e falha de rede
    if (erro instanceof DOMException && erro.name === 'AbortError') throw erro
    throw new ApiError(0, null, true)
  }

  if (resposta.status === 204) return undefined as T

  const dados = lerJson(await resposta.text())

  if (!resposta.ok) {
    const problema = dados && typeof dados === 'object' ? (dados as ProblemaApi) : null
    const erro = new ApiError(resposta.status, problema)

    if (autenticada) {
      if (resposta.status === 401) ganchos.aoNaoAutenticado(erro)
      if (resposta.status === 403) ganchos.aoProibido(erro)
    }

    throw erro
  }

  return dados as T
}
