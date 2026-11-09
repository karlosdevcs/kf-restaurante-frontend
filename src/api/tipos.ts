// Tipos que espelham, campo a campo, os DTOs e enums do backend (.NET).
// Fonte de verdade: DTOs/*.cs e Dominio/*.cs. Mudou la, muda aqui.
//
// Enums chegam como TEXTO (JsonStringEnumConverter). Cada um aceita valores que o front ainda nao conhece
// (`| Aberto<...>`): um valor novo no backend nao pode quebrar a tela.

type Aberto<T extends string> = T | (string & Record<never, never>)

// ---------- enums ----------

export const CATEGORIAS = ['Carne', 'Acompanhamento', 'Guarnicao', 'Salada', 'Bebida', 'Sobremesa'] as const
export type CategoriaConhecida = (typeof CATEGORIAS)[number]
export type Categoria = Aberto<CategoriaConhecida>

export const PAPEIS = ['Funcionario', 'Dono', 'Superuser'] as const
export type PapelConhecido = (typeof PAPEIS)[number]
export type Papel = Aberto<PapelConhecido>

export const PERMISSOES = [
  'VerPedidos',
  'EsgotarOpcoes',
  'AbrirFecharLoja',
  'GerenciarCardapio',
  'GerenciarCadastros',
  'AlterarWhatsApp',
] as const
export type PermissaoConhecida = (typeof PERMISSOES)[number]
export type Permissao = Aberto<PermissaoConhecida>

export const FORMAS_DE_PAGAMENTO = ['Pix', 'Dinheiro', 'CartaoDeDebito', 'CartaoDeCredito'] as const
export type FormaDePagamento = (typeof FORMAS_DE_PAGAMENTO)[number]

export const TIPOS_DE_ENTREGA = ['Retirada', 'Entrega'] as const
export type TipoDeEntrega = (typeof TIPOS_DE_ENTREGA)[number]

export type StatusPedido = Aberto<'Gerado' | 'Enviado'>
export type SituacaoCardapio = Aberto<'Rascunho' | 'Publicado' | 'Fechado'>

// ---------- erro ----------

// ProblemDetails (RFC 9110): formato de todo erro da API, inclusive 401, 403 e 404
export interface ProblemaApi {
  type?: string
  title?: string
  status?: number
  detail?: string
}

// ---------- opcoes e tamanhos ----------

export interface Opcao {
  id: number
  nome: string
  categoria: Categoria
  preco: number | null // null = so entra em marmita (nao e vendida avulsa)
  esgotado: boolean
}

export interface CriarOpcaoRequest {
  nome: string
  categoria: Categoria
  preco: number | null
}
export type AlterarOpcaoRequest = CriarOpcaoRequest

export interface LimiteCategoria {
  categoria: Categoria
  maximo: number
}

export interface Tamanho {
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

// ---------- cardapio e restaurante ----------

export interface Cardapio {
  id: number
  dataPublicacao: string // YYYY-MM-DD
  situacao: SituacaoCardapio
  atualizadoEm: string // UTC: quando as opcoes mudaram pela ultima vez
  opcoes: Opcao[]
}

export interface CriarCardapioRequest {
  opcoesIds: number[]
}

// a lista SUBSTITUI as opcoes do cardapio (so em rascunho)
export type AlterarOpcoesDoCardapioRequest = CriarCardapioRequest

export interface Restaurante {
  aberto: boolean
  whatsApp: string | null
}

export interface AlterarWhatsAppRequest {
  whatsApp: string
}

// ---------- pedidos ----------

// avulso preenche so opcaoId; marmita preenche tamanhoId e componentesIds; nunca os dois
export interface ItemAvulsoRequest {
  opcaoId: number
  quantidade: number
}
export interface ItemMarmitaRequest {
  tamanhoId: number
  componentesIds: number[]
  quantidade: number
}
export type ItemDoPedidoRequest = ItemAvulsoRequest | ItemMarmitaRequest

export interface CriarPedidoRequest {
  nomeCliente: string
  telefone: string
  cardapioId: number
  itens: ItemDoPedidoRequest[]
  formaDePagamento: FormaDePagamento
  trocoPara: number | null // so em dinheiro
  tipoDeEntrega: TipoDeEntrega
  endereco: string | null // so em entrega
  referencia: string | null // so em entrega
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
  horaPedido: string // UTC
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
  mensagemWhatsApp: string // pronta, vem da API: o front nunca a monta
  linkWhatsApp: string | null // null = loja sem WhatsApp cadastrado
}

// GET /pedidos devolve o pedido SEM a mensagem do WhatsApp e o link (esses so no detalhe)
export interface PedidoResumo {
  id: number
  numero: number
  horaPedido: string // UTC
  nomeCliente: string
  telefone: string
  status: StatusPedido
  formaDePagamento: FormaDePagamento
  trocoPara: number | null
  tipoDeEntrega: TipoDeEntrega
  endereco: string | null
  referencia: string | null
  observacao: string | null
  itens: ItemDoPedido[]
  total: number
}

// ---------- login e usuarios ----------

export interface Usuario {
  id: number
  nome: string
  email: string
  papel: Papel
  ativo: boolean
  permissoes: Permissao[] // lista de nomes, nunca um numero
}

export interface LoginRequest {
  email: string
  senha: string
}

export interface LoginResponse {
  token: string
  expiraEm: string // UTC
  usuario: Usuario
}

export interface TrocarSenhaRequest {
  senhaAtual: string
  novaSenha: string
}

export interface CriarUsuarioRequest {
  nome: string
  email: string
  senha: string
  papel: Papel
  permissoes?: Permissao[]
}

export interface AlterarUsuarioRequest {
  nome: string
  permissoes?: Permissao[] // substitui a lista atual
}

export interface RedefinirSenhaRequest {
  novaSenha: string
}
