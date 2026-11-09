import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buscarCardapio, buscarCardapioHoje, criarCardapio, fecharCardapio, publicarCardapio } from '../../../api/cardapios'
import { ehApiError } from '../../../api/client'
import { listarOpcoes } from '../../../api/opcoes'
import type { Cardapio } from '../../../api/tipos'
import { useAvisosDaLoja } from '../AvisosDaLoja'
import { CHAVE_DO_CARDAPIO_DE_HOJE } from '../useCardapioDeHoje'
import { guardarCardapioDeHoje, lerCardapioDeHojeGuardado } from './cardapioGuardado'

export const CHAVE_DO_CARDAPIO_DO_PAINEL = ['cardapio', 'painel'] as const

// Como o painel descobre o cardapio de hoje (spec, 11.3): primeiro GET /cardapios/hoje (cobre Publicado e Fechado).
// Se der 404, tenta o id guardado no localStorage com GET /cardapios/{id} (e o unico jeito de reencontrar um rascunho).
// Sem id guardado (ou id que nao existe mais), nao ha cardapio conhecido: estado "sem cardapio".
async function descobrirCardapioDeHoje(sinal: AbortSignal): Promise<Cardapio | null> {
  const publicado = await buscarCardapioHoje(sinal)
  if (publicado) return publicado

  const idGuardado = lerCardapioDeHojeGuardado()
  if (idGuardado === null) return null

  try {
    return await buscarCardapio(idGuardado, sinal)
  } catch (erro) {
    if (ehApiError(erro) && erro.status === 404) return null
    throw erro
  }
}

export function useCardapioDoPainel() {
  return useQuery({
    queryKey: CHAVE_DO_CARDAPIO_DO_PAINEL,
    queryFn: ({ signal }) => descobrirCardapioDeHoje(signal),
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
    guardarCardapioDeHoje(cardapio.id)
    queryClient.setQueryData(CHAVE_DO_CARDAPIO_DO_PAINEL, cardapio)
    // o cliente e o bloco "Acabou alguma coisa?" leem GET /cardapios/hoje: reconsulta para refletir a nova situacao
    void queryClient.invalidateQueries({ queryKey: CHAVE_DO_CARDAPIO_DE_HOJE })
  }

  const criar = useMutation({
    mutationFn: (opcoesIds: number[]) => criarCardapio({ opcoesIds }),
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

  return { criar, publicar, fechar }
}
