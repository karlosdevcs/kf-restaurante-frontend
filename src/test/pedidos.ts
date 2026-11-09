import { http, HttpResponse } from 'msw'
import type { Cardapio, Opcao, PedidoResumo, Restaurante } from '../api/tipos'
import { OPCOES } from './cliente'
import { servidor } from './servidor'

const API = 'http://localhost:5000'

export const RESUMO_NAO_ENVIADO: PedidoResumo = {
  id: 1,
  numero: 14,
  horaPedido: '2026-11-08T23:00:00Z', // 20:00 em Brasilia
  nomeCliente: 'Maria',
  telefone: '31988887777',
  status: 'Gerado',
  formaDePagamento: 'Dinheiro',
  trocoPara: 100,
  tipoDeEntrega: 'Entrega',
  endereco: 'Rua A, 10',
  referencia: 'portão azul',
  observacao: 'sem cebola',
  itens: [
    { nome: 'Marmita M', componentes: 'Arroz, Feijão', precoUnitario: 20, quantidade: 2, subtotal: 40 },
    { nome: 'Bebida 1', componentes: null, precoUnitario: 6, quantidade: 1, subtotal: 6 },
  ],
  total: 65,
}

export const RESUMO_ENVIADO: PedidoResumo = {
  id: 2,
  numero: 13,
  horaPedido: '2026-11-08T22:30:00Z',
  nomeCliente: 'João',
  telefone: '31977776666',
  status: 'Enviado',
  formaDePagamento: 'Pix',
  trocoPara: null,
  tipoDeEntrega: 'Retirada',
  endereco: null,
  referencia: null,
  observacao: null,
  itens: [{ nome: 'Prato 1', componentes: null, precoUnitario: 20, quantidade: 1, subtotal: 20 }],
  total: 20,
}

export interface CenarioDaLoja {
  lista: PedidoResumo[]
  restaurante: Restaurante
  cardapio: Cardapio | null
  /** quantas vezes cada rota foi chamada */
  chamadas: { lista: number; detalhes: Record<number, number>; esgotados: Array<{ id: number; esgotado: boolean }>; restaurante: string[]; whatsapp: string[] }
  /** problema devolvido por PATCH /opcoes/{id}/esgotado (se definido) */
  recusarEsgotado?: { status: number; detail: string }
  /** problema devolvido por POST /restaurante/abrir (se definido) */
  recusarAbrir?: { status: number; detail: string }
  /** problema devolvido por PUT /restaurante/whatsapp (se definido) */
  recusarWhatsApp?: { status: number; detail: string }
}

// Handlers da area da loja: lista de pedidos, detalhes, estado da loja, cardapio de hoje e esgotar.
export function servirLoja(sobrescrever: Partial<CenarioDaLoja> = {}): CenarioDaLoja {
  const cenario: CenarioDaLoja = {
    lista: [RESUMO_NAO_ENVIADO, RESUMO_ENVIADO],
    restaurante: { aberto: true, whatsApp: '5531999999999' },
    cardapio: { id: 5, dataPublicacao: '2026-11-08', situacao: 'Publicado', opcoes: OPCOES.map((o: Opcao) => ({ ...o })) },
    chamadas: { lista: 0, detalhes: {}, esgotados: [], restaurante: [], whatsapp: [] },
    ...sobrescrever,
  }

  const problema = (p: { status: number; detail: string }) => HttpResponse.json({ status: p.status, title: 'Regra de negócio violada.', detail: p.detail }, { status: p.status })

  servidor.use(
    http.get(`${API}/pedidos`, () => {
      cenario.chamadas.lista += 1
      return HttpResponse.json(cenario.lista)
    }),
    http.get(`${API}/pedidos/:id`, ({ params }) => {
      // a lista ja traz os itens: o painel nao deve mais chamar o detalhe de cada pedido
      const id = Number(params['id'])
      cenario.chamadas.detalhes[id] = (cenario.chamadas.detalhes[id] ?? 0) + 1
      return new HttpResponse(null, { status: 404 })
    }),
    http.get(`${API}/restaurante`, () => HttpResponse.json(cenario.restaurante)),
    http.post(`${API}/restaurante/abrir`, () => {
      cenario.chamadas.restaurante.push('abrir')
      if (cenario.recusarAbrir) return problema(cenario.recusarAbrir)
      cenario.restaurante = { ...cenario.restaurante, aberto: true }
      return HttpResponse.json(cenario.restaurante)
    }),
    http.post(`${API}/restaurante/fechar`, () => {
      cenario.chamadas.restaurante.push('fechar')
      cenario.restaurante = { ...cenario.restaurante, aberto: false }
      return HttpResponse.json(cenario.restaurante)
    }),
    http.put(`${API}/restaurante/whatsapp`, async ({ request }) => {
      const { whatsApp } = (await request.json()) as { whatsApp: string }
      cenario.chamadas.whatsapp.push(whatsApp)
      if (cenario.recusarWhatsApp) return problema(cenario.recusarWhatsApp)
      cenario.restaurante = { ...cenario.restaurante, whatsApp: whatsApp.replace(/\D/g, '').replace(/^(?!55)/, '55') }
      return HttpResponse.json(cenario.restaurante)
    }),
    http.get(`${API}/cardapios/hoje`, () => (cenario.cardapio ? HttpResponse.json(cenario.cardapio) : HttpResponse.json({ status: 404, title: 'Não encontrado.' }, { status: 404 }))),
    http.patch(`${API}/opcoes/:id/esgotado`, async ({ params, request }) => {
      const id = Number(params['id'])
      const { esgotado } = (await request.json()) as { esgotado: boolean }
      cenario.chamadas.esgotados.push({ id, esgotado })
      if (cenario.recusarEsgotado) return problema(cenario.recusarEsgotado)

      if (cenario.cardapio) {
        cenario.cardapio = { ...cenario.cardapio, opcoes: cenario.cardapio.opcoes.map((o) => (o.id === id ? { ...o, esgotado } : o)) }
      }
      const opcao = cenario.cardapio?.opcoes.find((o) => o.id === id)
      return HttpResponse.json(opcao)
    }),
  )

  return cenario
}
