import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { buscarEu, entrar as entrarNaApi } from '../../api/auth'
import { configurarAuth, ehApiError } from '../../api/client'
import { lerUtc } from '../../lib/formatar'
import { AuthContext, CHAVE_DO_USUARIO, type EstadoDaSessao, type MotivoDoFim, type ValorDaSessao } from './AuthContext'
import { expirou, gravarSessao, lerSessaoGuardada, limparSessaoGuardada, type SessaoGuardada } from './sessaoGuardada'

const INTERVALO_DE_ATUALIZACAO = 60_000

// Dono da sessao (spec, 10.2 e 10.3). O token fica so aqui (ref + sessionStorage) e nunca no valor do contexto.
// O usuario vem do GET /auth/eu, refeito ao voltar o foco, a cada 60 s com a aba visivel e depois de um 403.
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  const [sessao, setSessao] = useState<SessaoGuardada | null>(() => lerSessaoGuardada())
  const [motivoDoFim, setMotivoDoFim] = useState<MotivoDoFim | null>(null)
  const [avisoProibido, setAvisoProibido] = useState<string | null>(null)

  // o client de API le o token por aqui: sempre o valor mais recente, sem recriar os ganchos
  const sessaoRef = useRef(sessao)

  const encerrar = useCallback(
    (motivo: MotivoDoFim) => {
      sessaoRef.current = null
      limparSessaoGuardada()
      setSessao(null)
      setMotivoDoFim(motivo)
      setAvisoProibido(null)
      // nada de dado da loja pode sobrar para a proxima pessoa que entrar
      queryClient.clear()
    },
    [queryClient],
  )

  // layout effect: roda antes dos efeitos de qualquer filho, entao o token ja esta disponivel na primeira chamada
  useLayoutEffect(() => {
    return configurarAuth({
      obterToken: () => sessaoRef.current?.token ?? null,
      aoNaoAutenticado: () => {
        if (sessaoRef.current) encerrar('expirou')
      },
      aoProibido: (erro) => {
        setAvisoProibido(erro.message)
        void queryClient.invalidateQueries({ queryKey: CHAVE_DO_USUARIO })
      },
    })
  }, [encerrar, queryClient])

  // vence a sessao no horario de `expiraEm`; tambem confere ao voltar o foco (timers dormem em aba em segundo plano)
  useEffect(() => {
    if (!sessao) return

    const verificar = () => {
      if (expirou(sessao)) encerrar('expirou')
    }

    const restante = lerUtc(sessao.expiraEm).getTime() - Date.now()
    const temporizador = window.setTimeout(verificar, Math.min(Math.max(restante, 0), 2_000_000_000))
    window.addEventListener('focus', verificar)

    return () => {
      window.clearTimeout(temporizador)
      window.removeEventListener('focus', verificar)
    }
  }, [sessao, encerrar])

  const consulta = useQuery({
    queryKey: CHAVE_DO_USUARIO,
    queryFn: ({ signal }) => buscarEu(signal),
    enabled: sessao !== null,
    staleTime: 0,
    refetchInterval: INTERVALO_DE_ATUALIZACAO, // o TanStack Query pausa sozinho com a aba em segundo plano
    refetchOnWindowFocus: true,
  })

  const entrar = useCallback(
    async (email: string, senha: string) => {
      const resposta = await entrarNaApi({ email: email.trim(), senha })
      const nova = { token: resposta.token, expiraEm: resposta.expiraEm }

      sessaoRef.current = nova
      gravarSessao(nova)
      queryClient.setQueryData(CHAVE_DO_USUARIO, resposta.usuario)
      setMotivoDoFim(null)
      setAvisoProibido(null)
      setSessao(nova)
    },
    [queryClient],
  )

  const sair = useCallback(() => encerrar('saiu'), [encerrar])
  const dispensarAviso = useCallback(() => setAvisoProibido(null), [])
  const atualizarUsuario = useCallback(() => void queryClient.invalidateQueries({ queryKey: CHAVE_DO_USUARIO }), [queryClient])

  const usuario = sessao ? (consulta.data ?? null) : null

  let estado: EstadoDaSessao
  if (!sessao) estado = 'sem-sessao'
  else if (usuario) estado = 'pronto'
  else if (consulta.isError && !(ehApiError(consulta.error) && consulta.error.status === 401)) estado = 'erro'
  else estado = 'carregando'

  const valor = useMemo<ValorDaSessao>(
    () => ({ estado, usuario, motivoDoFim, avisoProibido, dispensarAviso, entrar, sair, atualizarUsuario }),
    [estado, usuario, motivoDoFim, avisoProibido, dispensarAviso, entrar, sair, atualizarUsuario],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
