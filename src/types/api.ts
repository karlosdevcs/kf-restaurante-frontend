// Tipos espelhando, campo a campo, os DTOs e enums de KFRestaurante (backend .NET).
// Qualquer mudança lá (DTOs/*.cs, Dominio/*.cs) precisa ser refletida aqui.

export type Categoria = 'Carne' | 'Acompanhamento' | 'Bebida' | 'Sobremesa' | 'Guarnicao' | 'Salada'

// categorias que podem ser componente de marmita (espelha Categoria.EhComponenteDeMarmita no backend)
export const CATEGORIAS_COMPONENTE: Categoria[] = ['Carne', 'Acompanhamento', 'Guarnicao', 'Salada']
export const CATEGORIAS_AVULSO: Categoria[] = ['Bebida', 'Sobremesa']

export const NOME_CATEGORIA: Record<Categoria, string> = {
  Carne: 'Carne',
  Acompanhamento: 'Acompanhamento',
  Guarnicao: 'Guarnição',
  Salada: 'Salada',
  Bebida: 'Bebida',
  Sobremesa: 'Sobremesa',
}

export type SituacaoCardapio = 'Rascunho' | 'Publicado' | 'Fechado'

export type FormaDePagamento = 'Pix' | 'Dinheiro' | 'CartaoDeDebito' | 'CartaoDeCredito'

export const NOME_FORMA_PAGAMENTO: Record<FormaDePagamento, string> = {
  Pix: 'Pix',
  Dinheiro: 'Dinheiro',
  CartaoDeDebito: 'Cartão de débito',
  CartaoDeCredito: 'Cartão de crédito',
}

export type TipoDeEntrega = 'Retirada' | 'Entrega'

export type StatusPedido = 'Gerado' | 'Enviado'

// ---------- Opção ----------

export interface Opcao {
  id: number
  nome: string
  categoria: Categoria
  preco: number | null // null = so entra em marmita, nao e vendida avulsa
  esgotado: boolean
}

export interface CriarOpcaoRequest {
  nome: string
  categoria: Categoria
  preco: number | null
}

export type AlterarOpcaoRequest = CriarOpcaoRequest

// ---------- Tamanho de marmita ----------

export interface LimiteCategoria {
  categoria: Categoria
  maximo: number
}

export interface TamanhoMarmita {
  id: number
  nome: string
  preco: number
  limitedeComponente: number
  limites: LimiteCategoria[]
}

export interface CriarTamanhoRequest {
  nome: string
  preco: number
  limitedeComponente: number
}

export type AlterarTamanhoRequest = CriarTamanhoRequest

export interface AlterarLimitesRequest {
  limites: LimiteCategoria[]
}

// ---------- Cardápio do dia ----------

export interface CardapioDoDia {
  id: number
  dataPublicacao: string // "2026-11-08"
  situacao: SituacaoCardapio
  opcoes: Opcao[]
}

export interface CriarCardapioRequest {
  opcoesIds: number[]
}

// ---------- Restaurante ----------

export interface Restaurante {
  aberto: boolean
  whatsApp: string | null
}

export interface AlterarWhatsAppRequest {
  whatsApp: string
}

// ---------- Pedido ----------

export interface CriarItemDoPedidoRequest {
  // item avulso: so opcaoId. Marmita: so tamanhoId + componentesIds. Nunca os dois.
  opcaoId?: number
  tamanhoId?: number
  componentesIds?: number[]
  quantidade: number
}

export interface CriarPedidoRequest {
  nomeCliente: string
  telefone: string
  cardapioId: number
  itens: CriarItemDoPedidoRequest[]
  formaDePagamento: FormaDePagamento
  trocoPara: number | null
  tipoDeEntrega: TipoDeEntrega
  endereco: string | null
  referencia: string | null
  observacao: string | null
}

export interface ItemDoPedido {
  nome: string
  componentes: string | null // so marmita: "Arroz, Arroz, Feijoada"
  precoUnitario: number
  quantidade: number
  subtotal: number
}

export interface Pedido {
  id: number
  numero: number
  horaPedido: string // ISO UTC
  nomeCliente: string
  telefone: string
  status: StatusPedido
  formaDePagamento: FormaDePagamento
  trocoPara: number | null
  tipoDeEntrega: TipoDeEntrega
  endereco: string | null
  referencia: string | null
  observacao: string | null
  cardapioId: number
  itens: ItemDoPedido[]
  total: number
  mensagemWhatsApp: string
  linkWhatsApp: string | null // null = loja sem whatsapp cadastrado
}

// GET /pedidos devolve o resumo (sem itens, sem mensagem)
export interface PedidoResumo {
  id: number
  numero: number
  horaPedido: string
  nomeCliente: string
  telefone: string
  status: StatusPedido
  formaDePagamento: FormaDePagamento
  tipoDeEntrega: TipoDeEntrega
  total: number
}

// formato padrao de erro da API (RFC 9110 ProblemDetails)
export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
}
