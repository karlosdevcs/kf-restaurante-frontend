import type { Categoria } from '../api/tipos'

// Configuracao CENTRALIZADA das categorias (spec, seção 12.1), indexada pelo valor que a API devolve.
// Os numeros do enum no backend (Carne = 0, Bebida = 2...) NAO sao a ordem de exibicao: nao depender deles.

export interface ConfigDeCategoria {
  rotulo: string
  rotuloCurto: string // celular e formularios
  plural: string // "1 carne" / "2 carnes", em minusculas
  componente: boolean // pode entrar numa marmita
  ordem: number // ordem dos grupos na montagem (so componentes)
  cor: string // variavel CSS do token: bolinha ou icone no lugar de foto
}

const CONFIG: Record<string, ConfigDeCategoria> = {
  Carne: { rotulo: 'Carne', rotuloCurto: 'Carne', plural: 'carnes', componente: true, ordem: 1, cor: 'var(--cat-carne)' },
  Acompanhamento: {
    rotulo: 'Acompanhamento',
    rotuloCurto: 'Acomp.',
    plural: 'acompanhamentos',
    componente: true,
    ordem: 2,
    cor: 'var(--cat-acompanhamento)',
  },
  // atencao: o valor da API e "Guarnicao", SEM cedilha
  Guarnicao: { rotulo: 'Guarnição', rotuloCurto: 'Guarnição', plural: 'guarnições', componente: true, ordem: 3, cor: 'var(--cat-guarnicao)' },
  Salada: { rotulo: 'Salada', rotuloCurto: 'Salada', plural: 'saladas', componente: true, ordem: 4, cor: 'var(--cat-salada)' },
  Bebida: { rotulo: 'Bebida', rotuloCurto: 'Bebida', plural: 'bebidas', componente: false, ordem: 0, cor: 'var(--cat-bebida)' },
  Sobremesa: { rotulo: 'Sobremesa', rotuloCurto: 'Sobremesa', plural: 'sobremesas', componente: false, ordem: 0, cor: 'var(--cat-sobremesa)' },
}

// Categoria desconhecida nao quebra: aparece com o proprio nome, cor neutra, tratada como componente.
export function categoriaInfo(categoria: Categoria): ConfigDeCategoria {
  return (
    CONFIG[categoria] ?? {
      rotulo: categoria,
      rotuloCurto: categoria,
      plural: `${categoria.toLowerCase()}s`,
      componente: true,
      ordem: 99,
      cor: 'var(--cat-desconhecida)',
    }
  )
}

export function ehComponenteDeMarmita(categoria: Categoria): boolean {
  return categoriaInfo(categoria).componente
}

// Ordem dos grupos na montagem: Carne, Acompanhamento, Guarnicao, Salada (desconhecidas por ultimo, por nome).
// Bebida e Sobremesa nao sao componentes: ficam de fora.
export function ordenarCategoriasDeComponente(categorias: Categoria[]): Categoria[] {
  return [...new Set(categorias)]
    .filter(ehComponenteDeMarmita)
    .sort((a, b) => categoriaInfo(a).ordem - categoriaInfo(b).ordem || a.localeCompare(b, 'pt-BR'))
}
