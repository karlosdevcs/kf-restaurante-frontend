import type { ProblemDetails } from '../types/api'

// sem .env, cai no endereco padrao da API em desenvolvimento
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

// Erro lançado para qualquer resposta não-2xx. `mensagem` já vem pronta para mostrar ao usuário
// (o `detail` do ProblemDetails do backend), com um texto genérico de reserva.
export class ApiError extends Error {
  status: number
  problema: ProblemDetails | null

  constructor(status: number, problema: ProblemDetails | null) {
    super(problema?.detail ?? problema?.title ?? `Erro ${status} ao falar com o servidor.`)
    this.name = 'ApiError'
    this.status = status
    this.problema = problema
  }
}

interface Opcoes {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | undefined>
}

function montarUrl(caminho: string, query?: Opcoes['query']): string {
  const url = new URL(BASE_URL + caminho)

  if (query) {
    for (const [chave, valor] of Object.entries(query)) {
      if (valor !== undefined) {
        url.searchParams.set(chave, String(valor))
      }
    }
  }

  return url.toString()
}

// nucleo unico usado por todas as funcoes de src/api/*.ts
export async function requisitar<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const resposta = await fetch(montarUrl(caminho, opcoes.query), {
    method: opcoes.method ?? 'GET',
    headers: opcoes.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: opcoes.body !== undefined ? JSON.stringify(opcoes.body) : undefined,
  })

  if (resposta.status === 204) {
    return undefined as T
  }

  const texto = await resposta.text()
  const dados = texto ? JSON.parse(texto) : null

  if (!resposta.ok) {
    throw new ApiError(resposta.status, dados as ProblemDetails | null)
  }

  return dados as T
}
