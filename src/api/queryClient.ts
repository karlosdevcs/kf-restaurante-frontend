import { QueryClient } from '@tanstack/react-query'
import { ehApiError } from './client'

export function criarQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // erro 4xx nao melhora tentando de novo; so vale repetir (uma vez) falha de rede ou 5xx
        retry: (tentativas, erro) => {
          const erroDoCliente = ehApiError(erro) && erro.status >= 400 && erro.status < 500
          return !erroDoCliente && tentativas < 1
        },
        refetchOnWindowFocus: true,
        staleTime: 15_000,
      },
      mutations: { retry: false },
    },
  })
}
