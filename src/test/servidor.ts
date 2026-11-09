import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

const API = 'http://localhost:5000'

// Respostas de fundo da area da loja: o cabecalho (selo da loja) e a aba Pedidos fazem estas leituras em qualquer teste
// que abra uma tela logada. Um teste que se importa com elas registra o proprio handler com `servidor.use(...)`,
// que tem prioridade sobre estes. Qualquer outra chamada sem handler continua sendo erro.
const respostasDeFundo = [
  http.get(`${API}/restaurante`, () => HttpResponse.json({ aberto: true, whatsApp: '5531999999999' })),
  http.get(`${API}/pedidos`, () => HttpResponse.json([])),
  http.get(`${API}/opcoes`, () => HttpResponse.json([])),
  http.get(`${API}/tamanhos`, () => HttpResponse.json([])),
  http.get(`${API}/cardapios/hoje`, () => HttpResponse.json({ status: 404, title: 'Não encontrado.' }, { status: 404 })),
]

// Servidor MSW compartilhado pelos testes. Cada teste registra os handlers de que precisa com `servidor.use(...)`.
export const servidor = setupServer(...respostasDeFundo)
