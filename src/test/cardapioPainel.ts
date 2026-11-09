import { http, HttpResponse } from 'msw'
import type { Cardapio } from '../api/tipos'
import { hojeEmBrasilia } from '../lib/formatar'
import { OPCOES } from './cliente'
import { servidor } from './servidor'

const API = 'http://localhost:5000'

export interface CenarioDoCardapio {
  /** o cardapio de hoje no servidor (null = nao existe). Rascunho so e alcancavel por id */
  cardapio: Cardapio | null
  /** problema devolvido por POST /cardapios (se definido) */
  recusarCriacao?: { status: number; detail: string }
  /** problema devolvido por PUT /cardapios/{id}/opcoes (se definido) */
  recusarAlteracao?: { status: number; detail: string }
  chamadas: { criados: number[][]; alteradas: Array<{ id: number; opcoesIds: number[] }>; publicados: number[]; fechados: number[] }
}

export function cardapioDeTeste(situacao: Cardapio['situacao'], id = 7, opcoesIds: number[] = [1, 3, 7]): Cardapio {
  return { id, dataPublicacao: hojeEmBrasilia(), situacao, opcoes: OPCOES.filter((o) => opcoesIds.includes(o.id)) }
}

// Handlers do painel de cardapio: GET /opcoes, GET /cardapios/hoje (so publicado ou fechado), GET /cardapios/{id},
// POST /cardapios (cria rascunho), /publicar e /fechar. Registre DEPOIS de `servirLoja` para sobrepor o cardapio de hoje dele.
export function servirCardapioDoPainel(sobrescrever: Partial<CenarioDoCardapio> = {}): CenarioDoCardapio {
  const cenario: CenarioDoCardapio = { cardapio: null, chamadas: { criados: [], alteradas: [], publicados: [], fechados: [] }, ...sobrescrever }
  const problema = (status: number, detail: string) => HttpResponse.json({ status, title: 'Regra de negócio violada.', detail }, { status })
  const naoEncontrado = () => HttpResponse.json({ status: 404, title: 'Não encontrado.' }, { status: 404 })

  servidor.use(
    http.get(`${API}/opcoes`, () => HttpResponse.json(OPCOES)),
    http.get(`${API}/cardapios/hoje`, () => (cenario.cardapio && cenario.cardapio.situacao !== 'Rascunho' ? HttpResponse.json(cenario.cardapio) : naoEncontrado())),
    // o painel enxerga o cardapio de hoje em qualquer situacao, inclusive rascunho
    http.get(`${API}/cardapios/hoje/painel`, () => (cenario.cardapio ? HttpResponse.json(cenario.cardapio) : naoEncontrado())),
    http.put(`${API}/cardapios/:id/opcoes`, async ({ request, params }) => {
      const id = Number(params['id'])
      const { opcoesIds } = (await request.json()) as { opcoesIds: number[] }
      cenario.chamadas.alteradas.push({ id, opcoesIds })
      if (cenario.recusarAlteracao) return problema(cenario.recusarAlteracao.status, cenario.recusarAlteracao.detail)
      if (!cenario.cardapio) return naoEncontrado()
      if (cenario.cardapio.situacao !== 'Rascunho') return problema(400, 'Só é possível trocar as opções de um cardápio em rascunho.')
      cenario.cardapio = { ...cenario.cardapio, opcoes: OPCOES.filter((o) => opcoesIds.includes(o.id)) }
      return HttpResponse.json(cenario.cardapio)
    }),
    http.post(`${API}/cardapios`, async ({ request }) => {
      const { opcoesIds } = (await request.json()) as { opcoesIds: number[] }
      cenario.chamadas.criados.push(opcoesIds)
      if (cenario.recusarCriacao) return problema(cenario.recusarCriacao.status, cenario.recusarCriacao.detail)
      cenario.cardapio = cardapioDeTeste('Rascunho', 7, opcoesIds)
      return HttpResponse.json(cenario.cardapio, { status: 201 })
    }),
    http.post(`${API}/cardapios/:id/publicar`, ({ params }) => {
      cenario.chamadas.publicados.push(Number(params['id']))
      if (!cenario.cardapio) return naoEncontrado()
      cenario.cardapio = { ...cenario.cardapio, situacao: 'Publicado' }
      return HttpResponse.json(cenario.cardapio)
    }),
    http.post(`${API}/cardapios/:id/fechar`, ({ params }) => {
      cenario.chamadas.fechados.push(Number(params['id']))
      if (!cenario.cardapio) return naoEncontrado()
      if (cenario.cardapio.situacao === 'Rascunho') return problema(400, 'Só é possível fechar um cardápio publicado.')
      cenario.cardapio = { ...cenario.cardapio, situacao: 'Fechado' }
      return HttpResponse.json(cenario.cardapio)
    }),
  )

  return cenario
}
