import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buscarCardapioHoje } from '../../api/cardapios'
import { alterarEsgotado } from '../../api/opcoes'
import type { Cardapio } from '../../api/tipos'
import { useAvisosDaLoja } from './AvisosDaLoja'

export const CHAVE_DO_CARDAPIO_DE_HOJE = ['cardapio', 'hoje'] as const

// Cardapio de hoje como o cliente ve (GET /cardapios/hoje e aberto). `null` = 404: nao ha cardapio publicado ou fechado hoje.
export function useCardapioDeHoje() {
  return useQuery({
    queryKey: CHAVE_DO_CARDAPIO_DE_HOJE,
    queryFn: ({ signal }) => buscarCardapioHoje(signal),
    staleTime: 0,
  })
}

// "Acabou alguma coisa?" (EsgotarOpcoes): PATCH /opcoes/{id}/esgotado com atualizacao otimista. Se a API recusar,
// a mudanca volta e o banner de erro mostra a mensagem. Depois do sucesso, o cardapio e reconsultado.
export function useEsgotarOpcao() {
  const queryClient = useQueryClient()
  const avisos = useAvisosDaLoja()

  return useMutation({
    mutationFn: ({ id, esgotado }: { id: number; esgotado: boolean }) => alterarEsgotado(id, esgotado),
    onMutate: async ({ id, esgotado }) => {
      avisos.limparErro()
      await queryClient.cancelQueries({ queryKey: CHAVE_DO_CARDAPIO_DE_HOJE })
      const anterior = queryClient.getQueryData<Cardapio | null>(CHAVE_DO_CARDAPIO_DE_HOJE)

      queryClient.setQueryData<Cardapio | null>(CHAVE_DO_CARDAPIO_DE_HOJE, (atual) =>
        atual ? { ...atual, opcoes: atual.opcoes.map((opcao) => (opcao.id === id ? { ...opcao, esgotado } : opcao)) } : atual,
      )

      return { anterior }
    },
    onError: (erro, _variaveis, contexto) => {
      queryClient.setQueryData(CHAVE_DO_CARDAPIO_DE_HOJE, contexto?.anterior)
      avisos.mostrarErro(erro.message)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: CHAVE_DO_CARDAPIO_DE_HOJE }),
  })
}
