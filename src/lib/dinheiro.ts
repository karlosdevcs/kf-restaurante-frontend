// Valor em reais digitado pela pessoa (troco do pedido, preco de opcao e de tamanho).
//   "100", "100,50", "100.50", "R$ 1.000,50"  ->  numero
//   vazio                                      ->  null
//   ilegivel                                   ->  NaN
export function lerValorEmReais(texto: string): number | null {
  let limpo = texto.replace(/R\$/gi, '').replace(/\s/g, '')
  if (limpo === '') return null

  // "1.000,50": ponto e milhar quando ha virgula; sem virgula, ponto e decimal
  limpo = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo
  if (!/^\d+(\.\d+)?$/.test(limpo)) return Number.NaN

  return Number(limpo)
}

// valor para voltar a um campo de texto ao editar: 12.5 -> "12,50"
export function valorParaCampo(valor: number | null | undefined): string {
  return valor === null || valor === undefined ? '' : valor.toFixed(2).replace('.', ',')
}
