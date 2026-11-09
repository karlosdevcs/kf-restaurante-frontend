import { http, HttpResponse } from 'msw'
import type { Cardapio, CriarPedidoRequest, Opcao, Pedido, Restaurante, Tamanho } from '../api/tipos'
import { servidor } from './servidor'

const API = 'http://localhost:5000'

export function opcao(id: number, nome: string, categoria: Opcao['categoria'], extra: Partial<Opcao> = {}): Opcao {
  return { id, nome, categoria, preco: null, esgotado: false, ...extra }
}

// nomes genericos de proposito: nada de dado dos prototipos
export const OPCOES: Opcao[] = [
  opcao(1, 'Carne 1', 'Carne'),
  opcao(2, 'Carne 2', 'Carne'),
  opcao(3, 'Acompanhamento 1', 'Acompanhamento'),
  opcao(4, 'Acompanhamento 2', 'Acompanhamento'),
  opcao(5, 'Guarnição 1', 'Guarnicao', { esgotado: true }),
  opcao(6, 'Salada 1', 'Salada'),
  opcao(7, 'Bebida 1', 'Bebida', { preco: 6 }),
  opcao(8, 'Sobremesa 1', 'Sobremesa', { preco: 5, esgotado: true }),
  opcao(9, 'Prato 1', 'Carne', { preco: 25 }), // componente COM preco: aparece nos dois lugares
]

export const TAMANHOS: Tamanho[] = [
  { id: 1, nome: 'P', preco: 15, limitedeComponente: 2, limites: [{ categoria: 'Carne', maximo: 1 }] },
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
  { id: 3, nome: 'G', preco: 25, limitedeComponente: 4, limites: [{ categoria: 'Carne', maximo: 2 }] },
]

export interface CenarioDoCliente {
  restaurante: Restaurante
  /** null = 404 (sem cardapio hoje ou rascunho) */
  cardapio: Cardapio | null
  tamanhos: Tamanho[]
  /** `true` faz as tres leituras falharem com 500 */
  falhar: boolean
  chamadas: { restaurante: number; cardapio: number; pedidos: CriarPedidoRequest[]; enviados: number[] }
  /** o que POST /pedidos devolve: um Pedido (201) ou um problema (status + detail) */
  respostaDoPedido: Pedido | { status: number; detail: string }
  /** status que POST /pedidos/{id}/enviado devolve */
  statusDoEnviado: number
}

export const MENSAGEM_DO_PEDIDO = '*Pedido nº 14*\n08/11/2026 às 20:00\nCliente: Maria · (31) 98888-7777\n\n1x Prato 1 — R$ 25,00\n\n*Total: R$ 25,00*'

export function pedidoDeResposta(extra: Partial<Pedido> = {}): Pedido {
  return {
    id: 77,
    numero: 14,
    horaPedido: '2026-11-08T23:00:00Z',
    nomeCliente: 'Maria',
    telefone: '31988887777',
    status: 'Gerado',
    formaDePagamento: 'Pix',
    trocoPara: null,
    tipoDeEntrega: 'Retirada',
    endereco: null,
    referencia: null,
    observacao: null,
    cardapioId: 5,
    itens: [],
    total: 25,
    mensagemWhatsApp: MENSAGEM_DO_PEDIDO,
    linkWhatsApp: 'https://wa.me/5531999999999?text=Pedido',
    ...extra,
  }
}

// Registra os handlers do cliente. O teste muda `cenario` no meio (ex.: loja fecha, item esgota) e o proximo request ja le o novo valor.
export function servirCliente(sobrescrever: Partial<CenarioDoCliente> = {}): CenarioDoCliente {
  const cenario: CenarioDoCliente = {
    restaurante: { aberto: true, whatsApp: '5531999999999' },
    cardapio: { id: 5, dataPublicacao: '2026-11-08', situacao: 'Publicado', opcoes: OPCOES },
    tamanhos: TAMANHOS,
    falhar: false,
    chamadas: { restaurante: 0, cardapio: 0, pedidos: [], enviados: [] },
    respostaDoPedido: pedidoDeResposta(),
    statusDoEnviado: 204,
    ...sobrescrever,
  }

  servidor.use(
    http.get(`${API}/restaurante`, () => {
      cenario.chamadas.restaurante += 1
      return cenario.falhar ? new HttpResponse(null, { status: 500 }) : HttpResponse.json(cenario.restaurante)
    }),
    http.get(`${API}/cardapios/hoje`, () => {
      cenario.chamadas.cardapio += 1
      if (cenario.falhar) return new HttpResponse(null, { status: 500 })
      return cenario.cardapio
        ? HttpResponse.json(cenario.cardapio)
        : HttpResponse.json({ status: 404, title: 'Não encontrado.' }, { status: 404 })
    }),
    http.get(`${API}/tamanhos`, () => (cenario.falhar ? new HttpResponse(null, { status: 500 }) : HttpResponse.json(cenario.tamanhos))),
    http.post(`${API}/pedidos`, async ({ request }) => {
      cenario.chamadas.pedidos.push((await request.json()) as CriarPedidoRequest)
      const resposta = cenario.respostaDoPedido
      return 'detail' in resposta
        ? HttpResponse.json({ status: resposta.status, title: 'Regra de negócio violada.', detail: resposta.detail }, { status: resposta.status })
        : HttpResponse.json(resposta, { status: 201 })
    }),
    http.post(`${API}/pedidos/:id/enviado`, ({ params }) => {
      cenario.chamadas.enviados.push(Number(params['id']))
      return new HttpResponse(null, { status: cenario.statusDoEnviado })
    }),
  )

  return cenario
}
