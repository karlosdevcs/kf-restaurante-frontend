import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import type { Usuario } from '../api/tipos'
import { criarQueryClient } from '../api/queryClient'
import { rotas } from '../routes'
import { servidor } from './servidor'

export const API = 'http://localhost:5000'
export const TOKEN_DE_TESTE = 'token-de-teste'

export function criarUsuario(sobrescrever: Partial<Usuario> = {}): Usuario {
  return { id: 1, nome: 'Pessoa de Teste', email: 'pessoa@teste.local', papel: 'Funcionario', ativo: true, permissoes: [], ...sobrescrever }
}

export function daquiA(milissegundos: number): string {
  return new Date(Date.now() + milissegundos).toISOString()
}

// sessao ja guardada, como se a pessoa tivesse entrado antes de recarregar a pagina
export function guardarSessao(expiraEm: string = daquiA(3_600_000)) {
  sessionStorage.setItem('kf:sessao', JSON.stringify({ token: TOKEN_DE_TESTE, expiraEm }))
}

// GET /auth/eu devolvendo o que `obter()` devolver na hora da chamada (assim o teste muda as permissoes no meio)
export function responderEu(obter: () => Usuario) {
  const chamadas: Array<string | null> = []
  servidor.use(
    http.get(`${API}/auth/eu`, ({ request }) => {
      chamadas.push(request.headers.get('Authorization'))
      return HttpResponse.json(obter())
    }),
  )
  return chamadas
}

export function renderizarLoja(caminho: string) {
  const queryClient = criarQueryClient()
  const roteador = createMemoryRouter(rotas, { initialEntries: [caminho] })
  const visual = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={roteador} />
    </QueryClientProvider>,
  )
  return { queryClient, roteador, ...visual }
}
