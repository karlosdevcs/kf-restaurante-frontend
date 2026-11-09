import { http, HttpResponse } from 'msw'
import type { CriarOpcaoRequest, CriarTamanhoRequest, LimiteCategoria, Opcao, Tamanho } from '../api/tipos'
import { servidor } from './servidor'

const API = 'http://localhost:5000'

type Problema = { status: number; detail: string }

export interface CenarioDosCadastros {
  opcoes: Opcao[]
  tamanhos: Tamanho[]
  /** problema devolvido por POST/PUT /opcoes (se definido) */
  recusarOpcao?: Problema
  /** problema devolvido por POST/PUT /tamanhos (se definido) */
  recusarTamanho?: Problema
  chamadas: {
    opcoes: Array<{ metodo: 'POST' | 'PUT'; id: number | null; corpo: CriarOpcaoRequest }>
    tamanhos: Array<{ metodo: 'POST' | 'PUT'; id: number | null; corpo: CriarTamanhoRequest }>
    limites: Array<{ id: number; limites: LimiteCategoria[] }>
    /** ordem em que as escritas de tamanho chegaram */
    ordemDosTamanhos: string[]
  }
}

export const OPCOES_CADASTRADAS: Opcao[] = [
  { id: 1, nome: 'Carne 1', categoria: 'Carne', preco: null, esgotado: false },
  { id: 2, nome: 'Salada 1', categoria: 'Salada', preco: null, esgotado: false },
  { id: 3, nome: 'Bebida 1', categoria: 'Bebida', preco: 6, esgotado: false },
  { id: 4, nome: 'Prato 1', categoria: 'Carne', preco: 25, esgotado: false },
]

export const TAMANHOS_CADASTRADOS: Tamanho[] = [
  {
    id: 2,
    nome: 'M',
    preco: 20,
    limitedeComponente: 3,
    limites: [
      { categoria: 'Carne', maximo: 1 },
      { categoria: 'Salada', maximo: 0 },
    ],
  },
  { id: 3, nome: 'G', preco: 25, limitedeComponente: 4, limites: [] },
]

// Handlers de cadastros: lista, cria e edita opcoes; lista, cria e edita tamanhos e seus limites.
export function servirCadastros(sobrescrever: Partial<CenarioDosCadastros> = {}): CenarioDosCadastros {
  const cenario: CenarioDosCadastros = {
    opcoes: OPCOES_CADASTRADAS.map((o) => ({ ...o })),
    tamanhos: TAMANHOS_CADASTRADOS.map((t) => ({ ...t, limites: [...t.limites] })),
    chamadas: { opcoes: [], tamanhos: [], limites: [], ordemDosTamanhos: [] },
    ...sobrescrever,
  }
  const problema = (p: Problema) => HttpResponse.json({ status: p.status, title: 'Regra de negócio violada.', detail: p.detail }, { status: p.status })

  servidor.use(
    http.get(`${API}/opcoes`, () => HttpResponse.json(cenario.opcoes)),
    http.post(`${API}/opcoes`, async ({ request }) => {
      const corpo = (await request.json()) as CriarOpcaoRequest
      cenario.chamadas.opcoes.push({ metodo: 'POST', id: null, corpo })
      if (cenario.recusarOpcao) return problema(cenario.recusarOpcao)
      const nova: Opcao = { id: 100 + cenario.opcoes.length, esgotado: false, ...corpo }
      cenario.opcoes = [...cenario.opcoes, nova]
      return HttpResponse.json(nova, { status: 201 })
    }),
    http.put(`${API}/opcoes/:id`, async ({ request, params }) => {
      const id = Number(params['id'])
      const corpo = (await request.json()) as CriarOpcaoRequest
      cenario.chamadas.opcoes.push({ metodo: 'PUT', id, corpo })
      if (cenario.recusarOpcao) return problema(cenario.recusarOpcao)
      cenario.opcoes = cenario.opcoes.map((o) => (o.id === id ? { ...o, ...corpo } : o))
      return HttpResponse.json(cenario.opcoes.find((o) => o.id === id))
    }),
    http.get(`${API}/tamanhos`, () => HttpResponse.json(cenario.tamanhos)),
    http.post(`${API}/tamanhos`, async ({ request }) => {
      const corpo = (await request.json()) as CriarTamanhoRequest
      cenario.chamadas.tamanhos.push({ metodo: 'POST', id: null, corpo })
      cenario.chamadas.ordemDosTamanhos.push('POST /tamanhos')
      if (cenario.recusarTamanho) return problema(cenario.recusarTamanho)
      const novo: Tamanho = { id: 200 + cenario.tamanhos.length, limites: [], ...corpo }
      cenario.tamanhos = [...cenario.tamanhos, novo]
      return HttpResponse.json(novo, { status: 201 })
    }),
    http.put(`${API}/tamanhos/:id`, async ({ request, params }) => {
      const id = Number(params['id'])
      const corpo = (await request.json()) as CriarTamanhoRequest
      cenario.chamadas.tamanhos.push({ metodo: 'PUT', id, corpo })
      cenario.chamadas.ordemDosTamanhos.push('PUT /tamanhos/{id}')
      if (cenario.recusarTamanho) return problema(cenario.recusarTamanho)
      cenario.tamanhos = cenario.tamanhos.map((t) => (t.id === id ? { ...t, ...corpo } : t))
      return HttpResponse.json(cenario.tamanhos.find((t) => t.id === id))
    }),
    http.put(`${API}/tamanhos/:id/limites`, async ({ request, params }) => {
      const id = Number(params['id'])
      const { limites } = (await request.json()) as { limites: LimiteCategoria[] }
      cenario.chamadas.limites.push({ id, limites })
      cenario.chamadas.ordemDosTamanhos.push('PUT /tamanhos/{id}/limites')
      cenario.tamanhos = cenario.tamanhos.map((t) => (t.id === id ? { ...t, limites } : t))
      return HttpResponse.json(cenario.tamanhos.find((t) => t.id === id))
    }),
  )

  return cenario
}
