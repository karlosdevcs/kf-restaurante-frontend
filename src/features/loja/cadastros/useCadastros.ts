import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { alterarOpcao, criarOpcao, listarOpcoes } from '../../../api/opcoes'
import { alterarLimites, alterarTamanho, criarTamanho, listarTamanhos } from '../../../api/tamanhos'
import type { CriarOpcaoRequest, CriarTamanhoRequest, LimiteCategoria, Tamanho } from '../../../api/tipos'

// GET /opcoes exige so estar logado; criar e editar exigem GerenciarCadastros. O cliente le tamanhos pela rota aberta.
export function useOpcoesCadastradas() {
  return useQuery({ queryKey: ['opcoes'], queryFn: ({ signal }) => listarOpcoes(signal), staleTime: 0 })
}

export function useTamanhosCadastrados() {
  return useQuery({ queryKey: ['tamanhos'], queryFn: ({ signal }) => listarTamanhos(signal), staleTime: 0 })
}

// POST /opcoes (sem id) ou PUT /opcoes/{id}. Mudancas valem dali em diante: pedidos ja feitos guardam a foto de nome e preco.
export function useSalvarOpcao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, dados }: { id: number | null; dados: CriarOpcaoRequest }) => (id === null ? criarOpcao(dados) : alterarOpcao(id, dados)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['opcoes'] })
      // o cardapio de hoje mostra nome, categoria e preco da opcao
      void queryClient.invalidateQueries({ queryKey: ['cardapio'] })
    },
  })
}

// Criar: POST /tamanhos. Editar: PUT /tamanhos/{id} e, em seguida, PUT /tamanhos/{id}/limites (que SUBSTITUI todos os limites).
// Se a segunda chamada falhar, a primeira ja valeu: a tela reconsulta a lista de qualquer jeito.
export function useSalvarTamanho() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, dados, limites }: { id: number | null; dados: CriarTamanhoRequest; limites: LimiteCategoria[] }): Promise<Tamanho> => {
      if (id === null) return criarTamanho(dados)
      await alterarTamanho(id, dados)
      return alterarLimites(id, { limites })
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ['tamanhos'] }),
  })
}
