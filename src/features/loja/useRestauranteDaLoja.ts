import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { abrirRestaurante, buscarRestaurante, fecharRestaurante } from '../../api/restaurante'
import type { Restaurante } from '../../api/tipos'
import { useAvisosDaLoja } from './AvisosDaLoja'

export const CHAVE_DO_RESTAURANTE = ['restaurante'] as const

// Estado da loja (aberta ou fechada), reconsultado a cada 60 s. Abrir e fechar sao idempotentes e devolvem o estado novo.
// Abrir sem WhatsApp cadastrado volta 400: a mensagem da API vai para o banner de erro da area de conteudo.
export function useRestauranteDaLoja() {
  const queryClient = useQueryClient()
  const avisos = useAvisosDaLoja()

  const consulta = useQuery({
    queryKey: CHAVE_DO_RESTAURANTE,
    queryFn: ({ signal }) => buscarRestaurante(signal),
    refetchInterval: 60_000,
    staleTime: 0,
  })

  const alternar = useMutation({
    mutationFn: (abrir: boolean) => (abrir ? abrirRestaurante() : fecharRestaurante()),
    onMutate: () => avisos.limparErro(),
    onSuccess: (restaurante: Restaurante) => queryClient.setQueryData(CHAVE_DO_RESTAURANTE, restaurante),
    onError: (erro) => avisos.mostrarErro(erro.message),
  })

  return {
    restaurante: consulta.data,
    /** passa o estado DESEJADO: `true` abre, `false` fecha */
    definirAberta: (abrir: boolean) => alternar.mutate(abrir),
    alternando: alternar.isPending,
  }
}
