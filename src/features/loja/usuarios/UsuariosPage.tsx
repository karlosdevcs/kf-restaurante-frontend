import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ehApiError } from '../../../api/client'
import type { Usuario } from '../../../api/tipos'
import { Banner, Button, Dialog, PasswordField } from '../../../components/ui'
import { cx } from '../../../lib/cx'
import { useIsDesktop } from '../../../lib/useIsDesktop'
import { validarSenha } from '../../../lib/usuarios'
import { useSessao } from '../../auth/useSessao'
import { CartaoDeErroDeCarga, Esqueleto } from '../../cliente/Estados'
import { FormularioDeUsuarioCartao } from './FormularioDeUsuarioCartao'
import { CartoesDeUsuarios, TabelaDeUsuarios } from './ListaDeUsuarios'
import { useAcoesDeUsuario, useUsuarios } from './useUsuarios'

// Aba Usuarios (papel Dono ou Superuser, spec 11.5). A hierarquia decide em quem cada um mexe: a lista, o formulario e as
// acoes so oferecem o que a API aceita. A API continua sendo a autoridade (403 aparece no banner da area de conteudo).
export function UsuariosPage() {
  const desktop = useIsDesktop()
  const navegar = useNavigate()
  const { usuario: ator } = useSessao()
  const usuarios = useUsuarios()
  const acoes = useAcoesDeUsuario()

  // `null` = fechado; `'novo'` = criando; um usuario = editando
  const [formulario, setFormulario] = useState<Usuario | 'novo' | null>(null)
  const [desativando, setDesativando] = useState<Usuario | null>(null)
  const [redefinindo, setRedefinindo] = useState<Usuario | null>(null)
  const [novaSenha, setNovaSenha] = useState('')
  const [tentouRedefinir, setTentouRedefinir] = useState(false)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [erroDaAcao, setErroDaAcao] = useState<string | null>(null)

  if (!ator) return null

  // erro de acao (ativar, desativar): 403 ja aparece no banner global; os outros, aqui
  function mostrarErro(erro: Error) {
    setErroDaAcao(ehApiError(erro) && erro.status === 403 ? null : erro.message)
  }

  const lista = usuarios.data ?? []
  const comAcoes = {
    aoEditar: (alvo: Usuario) => {
      setSucesso(null)
      setFormulario(alvo)
    },
    aoDesativar: (alvo: Usuario) => setDesativando(alvo),
    aoAtivar: (alvo: Usuario) => {
      setSucesso(null)
      setErroDaAcao(null)
      acoes.ativar.mutate(alvo.id, { onError: mostrarErro })
    },
    aoRedefinirSenha: (alvo: Usuario) => {
      setSucesso(null)
      setNovaSenha('')
      setTentouRedefinir(false)
      acoes.redefinirSenha.reset()
      setRedefinindo(alvo)
    },
    aoAbrirMinhaConta: () => navegar('/loja/conta'),
  }

  function confirmarDesativacao() {
    if (!desativando) return
    setErroDaAcao(null)
    acoes.desativar.mutate(desativando.id, {
      onSuccess: () => setDesativando(null),
      onError: (erro) => {
        setDesativando(null)
        mostrarErro(erro)
      },
    })
  }

  const erroDaSenha = tentouRedefinir ? validarSenha(novaSenha) : null
  function confirmarRedefinicao() {
    if (!redefinindo) return
    setTentouRedefinir(true)
    if (validarSenha(novaSenha)) return

    acoes.redefinirSenha.mutate(
      { id: redefinindo.id, novaSenha },
      {
        onSuccess: () => {
          setRedefinindo(null)
          setNovaSenha('')
          setSucesso('Senha redefinida. A conta também foi destravada.')
        },
      },
    )
  }
  const erroDaRedefinicao = acoes.redefinirSenha.isError && !(ehApiError(acoes.redefinirSenha.error) && acoes.redefinirSenha.error.status === 403) ? acoes.redefinirSenha.error.message : null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className={cx('font-extrabold', desktop ? 'text-[24px]' : 'text-[22px]')}>Usuários</h1>
        <Button
          variante="primary-ink"
          altura={desktop ? 46 : 44}
          className="px-5"
          onClick={() => {
            setSucesso(null)
            setFormulario('novo')
          }}
        >
          Novo usuário
        </Button>
      </div>

      {sucesso ? <Banner tipo="sucesso">{sucesso}</Banner> : null}
      {erroDaAcao ? <Banner tipo="erro">{erroDaAcao}</Banner> : null}

      {formulario !== null ? (
        <FormularioDeUsuarioCartao
          key={formulario === 'novo' ? 'novo' : formulario.id}
          ator={ator}
          usuario={formulario === 'novo' ? null : formulario}
          aoFechar={() => setFormulario(null)}
        />
      ) : null}

      {usuarios.isPending ? (
        <div role="status" aria-busy="true" aria-label="Carregando os usuários" className="flex flex-col gap-2">
          <Esqueleto className="h-16" />
          <Esqueleto className="h-16" />
        </div>
      ) : null}
      {usuarios.isError && usuarios.data === undefined ? <CartaoDeErroDeCarga aoTentarDeNovo={() => void usuarios.refetch()} /> : null}

      {lista.length > 0 ? (
        desktop ? <TabelaDeUsuarios ator={ator} usuarios={lista} acoes={comAcoes} /> : <CartoesDeUsuarios ator={ator} usuarios={lista} acoes={comAcoes} />
      ) : null}

      <Dialog
        aberto={desativando !== null}
        aoFechar={() => setDesativando(null)}
        titulo={`Desativar ${desativando?.nome ?? ''}?`}
        descricao="A pessoa perde o acesso na hora."
        acoes={
          <>
            <Button variante="outline" onClick={() => setDesativando(null)}>
              Cancelar
            </Button>
            <Button variante="primary-brand" ocupado={acoes.desativar.isPending} rotuloOcupado="Desativando..." onClick={confirmarDesativacao}>
              Desativar
            </Button>
          </>
        }
      />

      <Dialog
        aberto={redefinindo !== null}
        aoFechar={() => setRedefinindo(null)}
        titulo={`Redefinir a senha de ${redefinindo?.nome ?? ''}`}
        descricao="A conta também é destravada. A pessoa troca a senha depois, em Minha conta."
        acoes={
          <>
            <Button variante="outline" onClick={() => setRedefinindo(null)}>
              Cancelar
            </Button>
            <Button variante="primary-ink" ocupado={acoes.redefinirSenha.isPending} rotuloOcupado="Salvando..." onClick={confirmarRedefinicao}>
              Redefinir
            </Button>
          </>
        }
      >
        <PasswordField rotulo="Nova senha" variante="loja" senhaNova value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} erro={erroDaSenha} />
        {erroDaRedefinicao ? <Banner tipo="erro">{erroDaRedefinicao}</Banner> : null}
      </Dialog>
    </div>
  )
}
