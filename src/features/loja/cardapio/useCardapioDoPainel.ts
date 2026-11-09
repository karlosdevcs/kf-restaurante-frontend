import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { alterarOpcoesDoCardapio, buscarCardapioDoPainel, criarCardapio, fecharCardapio, publicarCardapio } from '../../../api/cardapios'
import { listarOpcoes } from '../../../api/opcoes'
import type { Cardapio } from '../../../api/tipos'
import { useAvisosDaLoja } from '../AvisosDaLoja'
import { CHAVE_DO_CARDAPIO_DE_HOJE } from '../useCardapioDeHoje'

export const CHAVE_DO_CARDAPIO_DO_PAINEL = ['cardapio', 'painel'] as const

// O painel le o cardapio de hoje em qualquer situacao (GET /cardapios/hoje/painel), inclusive o rascunho que o cliente nao ve.
export function useCardapioDoPainel() {
  return useQuery({
    queryKey: CHAVE_DO_CARDAPIO_DO_PAINEL,
    queryFn: ({ signal }) => buscarCardapioDoPainel(signal),
    staleTime: 0,
  })
}

// todas as opcoes cadastradas, para montar o cardapio (GET /opcoes exige login)
export function useTodasAsOpcoes(habilitada: boolean) {
  return useQuery({ queryKey: ['opcoes'], queryFn: ({ signal }) => listarOpcoes(signal), enabled: habilitada })
}

// Criar (rascunho), publicar (tambem REABRE um fechado) e fechar. Todas devolvem o cardapio completo: ele vira o estado da tela.
export function useAcoesDoCardapio() {
  const queryClient = useQueryClient()
  const avisos = useAvisosDaLoja()

  const aplicar = (cardapio: Cardapio) => {
    queryClient.setQueryData(CHAVE_DO_CARDAPIO_DO_PAINEL, cardapio)
    // o cliente e o bloco "Acabou alguma coisa?" leem GET /cardapios/hoje: reconsulta para refletir a nova situacao
    void queryClient.invalidateQueries({ queryKey: CHAVE_DO_CARDAPIO_DE_HOJE })
  }

  const criar = useMutation({
    mutationFn: (opcoesIds: number[]) => criarCardapio({ opcoesIds }),
    onMutate: () => avisos.limparErro(),
    onSuccess: aplicar,
  })

  // troca as opcoes de um rascunho
  const alterarOpcoes = useMutation({
    mutationFn: ({ id, opcoesIds }: { id: number; opcoesIds: number[] }) => alterarOpcoesDoCardapio(id, { opcoesIds }),
    onMutate: () => avisos.limparErro(),
    onSuccess: aplicar,
  })

  const publicar = useMutation({
    mutationFn: (id: number) => publicarCardapio(id),
    onMutate: () => avisos.limparErro(),
    onSuccess: aplicar,
    onError: (erro) => avisos.mostrarErro(erro.message),
  })

  const fechar = useMutation({
    mutationFn: (id: number) => fecharCardapio(id),
    onMutate: () => avisos.limparErro(),
    onSuccess: aplicar,
    onError: (erro) => avisos.mostrarErro(erro.message),
  })

  return { criar, alterarOpcoes, publicar, fechar }
}
