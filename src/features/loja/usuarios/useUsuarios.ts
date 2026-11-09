import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { alterarUsuario, ativarUsuario, criarUsuario, desativarUsuario, listarUsuarios, redefinirSenha } from '../../../api/usuarios'
import type { AlterarUsuarioRequest, CriarUsuarioRequest } from '../../../api/tipos'

export const CHAVE_DOS_USUARIOS = ['usuarios'] as const

// GET /usuarios lista a si mesmo e quem a pessoa gerencia (o dono ve funcionarios e a si; o superuser ve todos)
export function useUsuarios() {
  return useQuery({ queryKey: CHAVE_DOS_USUARIOS, queryFn: ({ signal }) => listarUsuarios(signal), staleTime: 0 })
}

// Toda escrita reconsulta a lista: ela e a fonte de verdade de quem aparece e com que papel e permissoes.
export function useAcoesDeUsuario() {
  const queryClient = useQueryClient()
  const atualizarLista = () => void queryClient.invalidateQueries({ queryKey: CHAVE_DOS_USUARIOS })

  return {
    criar: useMutation({ mutationFn: (dados: CriarUsuarioRequest) => criarUsuario(dados), onSuccess: atualizarLista }),
    alterar: useMutation({ mutationFn: ({ id, dados }: { id: number; dados: AlterarUsuarioRequest }) => alterarUsuario(id, dados), onSuccess: atualizarLista }),
    desativar: useMutation({ mutationFn: (id: number) => desativarUsuario(id), onSuccess: atualizarLista }),
    ativar: useMutation({ mutationFn: (id: number) => ativarUsuario(id), onSuccess: atualizarLista }),
    redefinirSenha: useMutation({ mutationFn: ({ id, novaSenha }: { id: number; novaSenha: string }) => redefinirSenha(id, { novaSenha }) }),
  }
}
