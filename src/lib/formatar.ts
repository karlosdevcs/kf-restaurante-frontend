import type { FormaDePagamento, TipoDeEntrega } from '../api/tipos'

// Formatacao (spec, seção 12.6). O restaurante vive no horario de Brasilia; a API grava em UTC.

const FUSO = 'America/Sao_Paulo'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

// sempre duas casas: "R$ 16,00" (o espaco e inseparavel, para o valor nao quebrar de linha)
export function formatBRL(valor: number): string {
  return moeda.format(valor)
}

// "1 item" / "2 itens". Zero usa o plural, como no portugues.
export function pluralizar(quantidade: number, singular: string, plural: string): string {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`
}

export function somenteDigitos(texto: string): string {
  return texto.replace(/\D/g, '')
}

// `horaPedido` e `expiraEm` chegam em UTC. Se a string vier sem fuso (sem "Z"), trata como UTC.
export function lerUtc(iso: string): Date {
  const temFuso = /(Z|[+-]\d{2}:?\d{2})$/i.test(iso)
  return new Date(temFuso ? iso : `${iso}Z`)
}

// HH:mm em Brasilia
export function formatHora(isoUtc: string): string {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: FUSO }).format(lerUtc(isoUtc))
}

// "domingo, 8 de novembro" (cabecalho). O "hoje" e sempre o de Brasilia.
export function formatDataCabecalho(data: Date = new Date()): string {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: FUSO }).format(data)
}

// "hoje às 14:35" ou "08/11 às 14:35" (dia de Brasilia), para "atualizado ..." no painel
export function rotuloDeAtualizacao(isoUtc: string, agora: Date = new Date()): string {
  const data = lerUtc(isoUtc)
  const diaDoEvento = hojeEmBrasilia(data)
  const hora = formatHora(isoUtc)
  if (diaDoEvento === hojeEmBrasilia(agora)) return `hoje às ${hora}`
  const [, mes, dia] = diaDoEvento.split('-')
  return `${dia}/${mes} às ${hora}`
}

// "2026-11-08" (dataPublicacao) -> "08/11/2026"
export function formatDataIso(dataIso: string): string {
  const [ano, mes, dia] = dataIso.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}

// o dia de Brasilia no formato da API (YYYY-MM-DD), para filtrar pedidos
export function hojeEmBrasilia(agora: Date = new Date()): string {
  const partes = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: FUSO }).format(agora)
  return partes // en-CA ja formata como YYYY-MM-DD
}

// (62) 99812-4471 (11 digitos) ou (62) 9812-4471 (10). Fora disso, devolve como veio.
export function formatTelefone(valor: string): string {
  const d = somenteDigitos(valor)
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return valor
}

// WhatsApp da loja (a API guarda "5531999999999"): +55 (31) 99999-9999
export function formatWhatsAppLoja(valor: string | null): string {
  if (!valor) return ''
  const d = somenteDigitos(valor)
  if (d.length >= 12 && d.startsWith('55')) return `+55 ${formatTelefone(d.slice(2))}`
  return valor
}

const ROTULO_PAGAMENTO: Record<FormaDePagamento, { curto: string; longo: string }> = {
  Pix: { curto: 'Pix', longo: 'Pix' },
  Dinheiro: { curto: 'Dinheiro', longo: 'Dinheiro' },
  CartaoDeDebito: { curto: 'Débito', longo: 'Cartão de débito' },
  CartaoDeCredito: { curto: 'Crédito', longo: 'Cartão de crédito' },
}

// "Débito" (curto) ou "Cartão de débito" (longo). Forma desconhecida volta como veio.
export function rotuloPagamento(forma: string, estilo: 'curto' | 'longo' = 'curto'): string {
  const rotulos = ROTULO_PAGAMENTO[forma as FormaDePagamento]
  return rotulos ? rotulos[estilo] : forma
}

export function rotuloEntrega(tipo: TipoDeEntrega | string): string {
  return tipo === 'Entrega' ? 'Entrega' : tipo === 'Retirada' ? 'Retirada' : tipo
}

// iniciais para o avatar do menu do usuario: "Maria da Silva" -> "MS"
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  const primeira = partes[0]?.[0] ?? ''
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? '') : ''
  return (primeira + ultima).toUpperCase()
}
