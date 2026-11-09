import type { AlterarLimitesRequest, Categoria, CriarOpcaoRequest, CriarTamanhoRequest, LimiteCategoria, Opcao, Tamanho } from '../api/tipos'
import { CATEGORIAS } from '../api/tipos'
import { categoriaInfo, ehComponenteDeMarmita, ordenarCategoriasDeComponente } from './categoriaConfig'
import { lerValorEmReais, valorParaCampo } from './dinheiro'

// Formularios de cadastro (spec, 11.4). As regras espelham o dominio; o backend continua sendo a autoridade.

// ---------- opcoes ----------

export interface FormularioDeOpcao {
  nome: string
  categoria: Categoria
  /** so para componente de marmita: "Vender tambem avulsa" */
  vendeAvulsa: boolean
  preco: string
}

export const OPCAO_EM_BRANCO: FormularioDeOpcao = { nome: '', categoria: 'Carne', vendeAvulsa: false, preco: '' }

export function formularioDaOpcao(opcao: Opcao): FormularioDeOpcao {
  return { nome: opcao.nome, categoria: opcao.categoria, vendeAvulsa: opcao.preco !== null, preco: valorParaCampo(opcao.preco) }
}

// Bebida e Sobremesa so sao vendidas avulsas: preco obrigatorio. Componente: preco opcional (so com "Vender tambem avulsa").
export const categoriaExigePreco = (categoria: Categoria) => !ehComponenteDeMarmita(categoria)

export function opcaoTemPreco(formulario: FormularioDeOpcao): boolean {
  return categoriaExigePreco(formulario.categoria) || formulario.vendeAvulsa
}

export interface ErrosDaOpcao {
  nome?: string
  preco?: string
}

export function validarOpcao(formulario: FormularioDeOpcao): ErrosDaOpcao {
  const erros: ErrosDaOpcao = {}
  if (formulario.nome.trim() === '') erros.nome = 'Informe o nome.'

  if (opcaoTemPreco(formulario)) {
    const preco = lerValorEmReais(formulario.preco)
    if (preco === null) erros.preco = 'Informe o preço.'
    else if (Number.isNaN(preco) || preco < 0) erros.preco = 'Informe um preço válido, igual ou maior que zero.'
  }

  return erros
}

export function payloadDaOpcao(formulario: FormularioDeOpcao): CriarOpcaoRequest {
  const preco = opcaoTemPreco(formulario) ? lerValorEmReais(formulario.preco) : null
  return { nome: formulario.nome.trim(), categoria: formulario.categoria, preco: preco === null || Number.isNaN(preco) ? null : preco }
}

// categorias oferecidas no formulario: as conhecidas, mais a da propria opcao se for uma que o front ainda nao conhece
export function categoriasDoFormulario(atual: Categoria): Categoria[] {
  return (CATEGORIAS as readonly string[]).includes(atual) ? [...CATEGORIAS] : [...CATEGORIAS, atual]
}

// Bebida e Sobremesa por ultimo; componentes na ordem da secao 12.1; depois por nome
export function ordenarOpcoes(opcoes: readonly Opcao[]): Opcao[] {
  const ordem = (opcao: Opcao) => categoriaInfo(opcao.categoria).ordem || 50
  return [...opcoes].sort((a, b) => ordem(a) - ordem(b) || a.nome.localeCompare(b.nome, 'pt-BR'))
}

// ---------- tamanhos e limites ----------

export interface FormularioDeTamanho {
  nome: string
  preco: string
  limiteTotal: string
  /** categoria de componente -> maximo; ausente = sem limite proprio */
  limites: Partial<Record<string, number>>
}

export const TAMANHO_EM_BRANCO: FormularioDeTamanho = { nome: '', preco: '', limiteTotal: '', limites: {} }

export function formularioDoTamanho(tamanho: Tamanho): FormularioDeTamanho {
  const limites: Partial<Record<string, number>> = {}
  for (const limite of tamanho.limites) limites[limite.categoria] = limite.maximo
  return { nome: tamanho.nome, preco: valorParaCampo(tamanho.preco), limiteTotal: String(tamanho.limitedeComponente), limites }
}

// as categorias que podem ter limite: so as de componente, na ordem da secao 12.1
export function categoriasComLimite(): Categoria[] {
  return ordenarCategoriasDeComponente(CATEGORIAS.map((categoria) => categoria as Categoria))
}

export interface ErrosDoTamanho {
  nome?: string
  preco?: string
  limiteTotal?: string
}

function lerInteiro(texto: string): number | null {
  const limpo = texto.trim()
  return /^\d+$/.test(limpo) ? Number(limpo) : null
}

export function validarTamanho(formulario: FormularioDeTamanho): ErrosDoTamanho {
  const erros: ErrosDoTamanho = {}
  if (formulario.nome.trim() === '') erros.nome = 'Informe o nome.'

  const preco = lerValorEmReais(formulario.preco)
  if (preco === null) erros.preco = 'Informe o preço.'
  else if (Number.isNaN(preco) || preco < 0) erros.preco = 'Informe um preço válido, igual ou maior que zero.'

  if (lerInteiro(formulario.limiteTotal) === null) erros.limiteTotal = 'Informe um número inteiro, igual ou maior que zero.'

  return erros
}

export function payloadDoTamanho(formulario: FormularioDeTamanho): CriarTamanhoRequest {
  return {
    nome: formulario.nome.trim(),
    preco: lerValorEmReais(formulario.preco) ?? 0,
    limitedeComponente: lerInteiro(formulario.limiteTotal) ?? 0,
  }
}

// PUT /tamanhos/{id}/limites SUBSTITUI todos os limites: o que nao estiver na lista fica sem limite proprio
export function payloadDosLimites(limites: FormularioDeTamanho['limites']): AlterarLimitesRequest {
  const lista: LimiteCategoria[] = []
  for (const categoria of categoriasComLimite()) {
    const maximo = limites[categoria]
    if (maximo !== undefined) lista.push({ categoria, maximo })
  }
  return { limites: lista }
}

// "Carne: até 2", "Salada: não incluso"
export function textoDoLimite(limite: LimiteCategoria): string {
  const nome = categoriaInfo(limite.categoria).rotulo
  return limite.maximo === 0 ? `${nome}: não incluso` : `${nome}: até ${limite.maximo}`
}
