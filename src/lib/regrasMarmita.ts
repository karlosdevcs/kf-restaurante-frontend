import type { Categoria, Opcao, Tamanho } from '../api/tipos'

// Regras de montagem da marmita (spec, 12.2). Espelham o backend para dar resposta imediata;
// a API continua sendo a autoridade e o erro de dominio dela e sempre mostrado.

type OpcaoDaMarmita = Pick<Opcao, 'id' | 'categoria' | 'esgotado'>

export interface ContagemDaMontagem {
  total: number
  porCategoria: Record<string, number>
}

export function contarSelecao(selecionados: number[], opcoes: ReadonlyMap<number, OpcaoDaMarmita>): ContagemDaMontagem {
  const porCategoria: Record<string, number> = {}
  let total = 0

  for (const id of selecionados) {
    const opcao = opcoes.get(id)
    if (!opcao) continue
    total += 1
    porCategoria[opcao.categoria] = (porCategoria[opcao.categoria] ?? 0) + 1
  }

  return { total, porCategoria }
}

// categoria sem entrada na lista nao tem limite proprio (vale so o total). `maximo` 0 bloqueia a categoria toda.
export function limiteDaCategoria(tamanho: Pick<Tamanho, 'limites'>, categoria: Categoria): number | null {
  return tamanho.limites.find((limite) => limite.categoria === categoria)?.maximo ?? null
}

// Um tile fica BLOQUEADO quando nao esta marcado E (esta esgotado OU o total atingiu o limite OU a categoria atingiu o limite)
export function tileBloqueado(
  opcao: OpcaoDaMarmita,
  tamanho: Pick<Tamanho, 'limitedeComponente' | 'limites'>,
  selecionados: number[],
  opcoes: ReadonlyMap<number, OpcaoDaMarmita>,
): boolean {
  if (selecionados.includes(opcao.id)) return false
  if (opcao.esgotado) return true

  const { total, porCategoria } = contarSelecao(selecionados, opcoes)
  if (total >= tamanho.limitedeComponente) return true

  const limite = limiteDaCategoria(tamanho, opcao.categoria)
  return limite !== null && (porCategoria[opcao.categoria] ?? 0) >= limite
}

// marcar e desmarcar sao livres; a ordem de selecao e a ordem em que foram marcados
export function alternarSelecao(selecionados: number[], id: number): number[] {
  return selecionados.includes(id) ? selecionados.filter((marcado) => marcado !== id) : [...selecionados, id]
}

// Trocar de tamanho com selecao feita (12.2):
//  1. categoria com limite menor que o numero de marcados: remove os excedentes, comecando pelos marcados por ultimo
//  2. depois, se o total exceder o limite do novo tamanho, corta mantendo os primeiros marcados
//  3. o que sobrar continua marcado
export function ajustarSelecaoAoTamanho(
  selecionados: number[],
  novoTamanho: Pick<Tamanho, 'limitedeComponente' | 'limites'>,
  opcoes: ReadonlyMap<number, OpcaoDaMarmita>,
): number[] {
  // 1. por categoria: guarda os primeiros marcados ate o limite da categoria (os ultimos saem)
  const mantidosPorCategoria: Record<string, number> = {}
  const aposCategorias = selecionados.filter((id) => {
    const opcao = opcoes.get(id)
    if (!opcao) return false

    const limite = limiteDaCategoria(novoTamanho, opcao.categoria)
    const jaMantidos = mantidosPorCategoria[opcao.categoria] ?? 0
    if (limite !== null && jaMantidos >= limite) return false

    mantidosPorCategoria[opcao.categoria] = jaMantidos + 1
    return true
  })

  // 2. total: mantem os primeiros na ordem de selecao
  return aposCategorias.slice(0, novoTamanho.limitedeComponente)
}

// tamanho do meio da lista (o segundo, se houver 3); o primeiro se houver menos (spec, 9.3).
// Com 4 ou mais, o do meio e o indice floor((n - 1) / 2).
export function tamanhoPadrao<T>(tamanhos: readonly T[]): T | undefined {
  return tamanhos[Math.floor((tamanhos.length - 1) / 2)]
}
