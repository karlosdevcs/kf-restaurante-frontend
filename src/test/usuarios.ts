import { http, HttpResponse } from 'msw'
import type { AlterarUsuarioRequest, CriarUsuarioRequest, Usuario } from '../api/tipos'
import { servidor } from './servidor'

const API = 'http://localhost:5000'

type Problema = { status: number; detail: string }

export interface CenarioDosUsuarios {
  /** o que GET /usuarios devolve (a propria pessoa e quem ela gerencia) */
  usuarios: Usuario[]
  /** problema devolvido por POST /usuarios (se definido) */
  recusarCriacao?: Problema
  chamadas: {
    criados: CriarUsuarioRequest[]
    alterados: Array<{ id: number; corpo: AlterarUsuarioRequest }>
    desativados: number[]
    ativados: number[]
    senhas: Array<{ id: number; novaSenha: string }>
  }
}

export function usuario(id: number, nome: string, extra: Partial<Usuario> = {}): Usuario {
  return { id, nome, email: `${nome.toLowerCase().replace(/\s+/g, '.')}@teste.local`, papel: 'Funcionario', ativo: true, permissoes: [], ...extra }
}

// Handlers da gestao de usuarios. Quem decide o 403 e a API de verdade: aqui o teste so responde o que o cenario manda.
export function servirUsuarios(sobrescrever: Partial<CenarioDosUsuarios> = {}): CenarioDosUsuarios {
  const cenario: CenarioDosUsuarios = {
    usuarios: [],
    chamadas: { criados: [], alterados: [], desativados: [], ativados: [], senhas: [] },
    ...sobrescrever,
  }
  const problema = (p: Problema) => HttpResponse.json({ status: p.status, title: 'Problema.', detail: p.detail }, { status: p.status })
  const trocar = (id: number, mudanca: Partial<Usuario>) => {
    cenario.usuarios = cenario.usuarios.map((u) => (u.id === id ? { ...u, ...mudanca } : u))
    return HttpResponse.json(cenario.usuarios.find((u) => u.id === id))
  }

  servidor.use(
    http.get(`${API}/usuarios`, () => HttpResponse.json(cenario.usuarios)),
    http.post(`${API}/usuarios`, async ({ request }) => {
      const corpo = (await request.json()) as CriarUsuarioRequest
      cenario.chamadas.criados.push(corpo)
      if (cenario.recusarCriacao) return problema(cenario.recusarCriacao)
      const novo: Usuario = { id: 100 + cenario.usuarios.length, nome: corpo.nome, email: corpo.email.toLowerCase(), papel: corpo.papel, ativo: true, permissoes: corpo.permissoes ?? [] }
      cenario.usuarios = [...cenario.usuarios, novo]
      return HttpResponse.json(novo, { status: 201 })
    }),
    http.put(`${API}/usuarios/:id/senha`, async ({ request, params }) => {
      const { novaSenha } = (await request.json()) as { novaSenha: string }
      cenario.chamadas.senhas.push({ id: Number(params['id']), novaSenha })
      return new HttpResponse(null, { status: 204 })
    }),
    http.put(`${API}/usuarios/:id`, async ({ request, params }) => {
      const id = Number(params['id'])
      const corpo = (await request.json()) as AlterarUsuarioRequest
      cenario.chamadas.alterados.push({ id, corpo })
      return trocar(id, { nome: corpo.nome, permissoes: corpo.permissoes ?? [] })
    }),
    http.post(`${API}/usuarios/:id/desativar`, ({ params }) => {
      cenario.chamadas.desativados.push(Number(params['id']))
      return trocar(Number(params['id']), { ativo: false })
    }),
    http.post(`${API}/usuarios/:id/ativar`, ({ params }) => {
      cenario.chamadas.ativados.push(Number(params['id']))
      return trocar(Number(params['id']), { ativo: true })
    }),
  )

  return cenario
}
