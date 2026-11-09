import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { buscarCardapioHoje } from '../../api/cardapios'
import { buscarRestaurante } from '../../api/restaurante'
import { listarTamanhos } from '../../api/tamanhos'
import type { Categoria, Opcao, Restaurante, Tamanho } from '../../api/tipos'
import { categoriaInfo, ehComponenteDeMarmita, ordenarCategoriasDeComponente } from '../../lib/categoriaConfig'

const INTERVALO_DE_ATUALIZACAO = 60_000

export type MotivoDoBloqueio = 'loja-fechada' | 'cardapio-encerrado'

export const TEXTO_DO_BLOQUEIO: Record<MotivoDoBloqueio, string> = {
  'loja-fechada': 'A loja está fechada. Você pode ver o cardápio, mas não consegue pedir agora.',
  'cardapio-encerrado': 'O cardápio de hoje foi encerrado. Você pode ver o que teve, mas não consegue pedir.',
}

export interface DadosDoCliente {
  estado: 'carregando' | 'erro' | 'pronto'
  recarregar: () => void
  restaurante: Restaurante | undefined
  tamanhos: Tamanho[]
  cardapioId: number | null
  /** UTC: quando as opcoes do cardapio mudaram pela ultima vez */
  atualizadoEm: string | null
  opcoes: Opcao[]
  opcoesPorId: ReadonlyMap<number, Opcao>
  /** categorias que nao sao Bebida nem Sobremesa: entram nos tiles de montar e em "Hoje tem" */
  componentes: Opcao[]
  /** na ordem dos grupos da secao 12.1 */
  categoriasDeComponente: Categoria[]
  /** qualquer opcao com preco, de qualquer categoria */
  avulsos: Opcao[]
  /** sem cardapio publicado hoje, ou cardapio sem componentes */
  semCardapio: boolean
  motivoDoBloqueio: MotivoDoBloqueio | null
  podePedir: boolean
}

const porCategoriaENome = (a: Opcao, b: Opcao) =>
  categoriaInfo(a.categoria).ordem - categoriaInfo(b.categoria).ordem || a.nome.localeCompare(b.nome, 'pt-BR')

// Dados do cliente (spec, 9.1): restaurante, cardapio de hoje e tamanhos, em paralelo. Restaurante e cardapio sao
// reconsultados a cada 60 s e quando a janela volta ao foco, para "esgotado" e "fechado" chegarem sem recarregar.
// O cliente NAO consulta GET /opcoes (exige login): tudo vem do cardapio de hoje.
export function useDadosDoCliente(): DadosDoCliente {
  const restaurante = useQuery({
    queryKey: ['restaurante'],
    queryFn: ({ signal }) => buscarRestaurante(signal),
    refetchInterval: INTERVALO_DE_ATUALIZACAO,
    staleTime: 0, // volta ao foco = reconsulta, sempre
  })
  const cardapio = useQuery({
    queryKey: ['cardapio', 'hoje'],
    queryFn: ({ signal }) => buscarCardapioHoje(signal),
    refetchInterval: INTERVALO_DE_ATUALIZACAO,
    staleTime: 0,
  })
  const tamanhos = useQuery({ queryKey: ['tamanhos'], queryFn: ({ signal }) => listarTamanhos(signal) })

  const consultas = [restaurante, cardapio, tamanhos]
  // so e erro de tela se faltar dado: uma atualizacao que falha com dado em maos nao derruba a tela
  const comFalha = consultas.some((consulta) => consulta.isError && consulta.data === undefined)
  const carregando = !comFalha && consultas.some((consulta) => consulta.data === undefined)

  const dadosDoCardapio = cardapio.data ?? null
  const opcoes = useMemo(() => dadosDoCardapio?.opcoes ?? [], [dadosDoCardapio])

  const derivados = useMemo(() => {
    const componentes = opcoes.filter((opcao) => ehComponenteDeMarmita(opcao.categoria)).sort(porCategoriaENome)
    return {
      opcoesPorId: new Map(opcoes.map((opcao) => [opcao.id, opcao] as const)),
      componentes,
      categoriasDeComponente: ordenarCategoriasDeComponente(componentes.map((opcao) => opcao.categoria)),
      avulsos: opcoes.filter((opcao) => opcao.preco !== null),
    }
  }, [opcoes])

  let motivoDoBloqueio: MotivoDoBloqueio | null = null
  if (restaurante.data && !restaurante.data.aberto) motivoDoBloqueio = 'loja-fechada'
  else if (dadosDoCardapio?.situacao === 'Fechado') motivoDoBloqueio = 'cardapio-encerrado'

  const estado = comFalha ? 'erro' : carregando ? 'carregando' : 'pronto'

  return {
    estado,
    recarregar: () => {
      for (const consulta of consultas) void consulta.refetch()
    },
    restaurante: restaurante.data,
    tamanhos: tamanhos.data ?? [],
    cardapioId: dadosDoCardapio?.id ?? null,
    atualizadoEm: dadosDoCardapio?.atualizadoEm ?? null,
    opcoes,
    ...derivados,
    semCardapio: estado === 'pronto' && (dadosDoCardapio === null || derivados.componentes.length === 0),
    motivoDoBloqueio,
    podePedir: estado === 'pronto' && motivoDoBloqueio === null && dadosDoCardapio !== null,
  }
}
