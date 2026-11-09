import { hojeEmBrasilia } from '../../../lib/formatar'

// So o ID do cardapio de hoje, com o dia de Brasilia (spec, 11.3). Nao e dado pessoal nem segredo, por isso pode ficar no
// localStorage (o token nunca fica la). Serve para reencontrar um RASCUNHO: a API so devolve rascunho por id.
const CHAVE = 'kf:cardapio-hoje'

export function guardarCardapioDeHoje(id: number): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify({ data: hojeEmBrasilia(), id }))
  } catch {
    // sem armazenamento: o painel nao reencontra o rascunho depois de recarregar
  }
}

// o id guardado hoje, ou null (outro dia, nada guardado ou dado quebrado)
export function lerCardapioDeHojeGuardado(): number | null {
  try {
    const texto = localStorage.getItem(CHAVE)
    if (!texto) return null
    const dados: unknown = JSON.parse(texto)
    if (dados && typeof dados === 'object' && 'data' in dados && 'id' in dados) {
      const { data, id } = dados as { data: unknown; id: unknown }
      if (data === hojeEmBrasilia() && typeof id === 'number') return id
    }
  } catch {
    // JSON quebrado: ignora
  }
  return null
}
