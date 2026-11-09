const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatarMoeda(valor: number): string {
  return moeda.format(valor)
}

export function somenteDigitos(texto: string): string {
  return texto.replace(/\D/g, '')
}

// 31999999999 -> (31) 99999-9999 | 3133334444 -> (31) 3333-4444
export function formatarTelefone(digitos: string): string {
  const d = somenteDigitos(digitos)
  if (d.length < 10) return d
  const ddd = d.slice(0, 2)
  const numero = d.slice(2)
  const corte = numero.length - 4
  return `(${ddd}) ${numero.slice(0, corte)}-${numero.slice(corte)}`
}

// o backend grava em UTC; o restaurante vive no horario de Brasilia
export function formatarHora(isoUtc: string): string {
  return new Date(isoUtc).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}

export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof Error) return erro.message
  return 'Algo deu errado. Tente de novo.'
}
