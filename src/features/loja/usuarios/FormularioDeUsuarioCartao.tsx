import { useId, useState, type FormEvent } from 'react'
import { ehApiError } from '../../../api/client'
import { PERMISSOES, type Papel, type Permissao, type Usuario } from '../../../api/tipos'
import { Banner, Button, ChoiceButton, Field, ListCheckbox, PasswordField } from '../../../components/ui'
import { rotuloDaPermissao, rotuloDoPapel } from '../../../lib/permissoes'
import {
  ehSuperuser,
  papeisQuePodeCriar,
  permissaoEditavel,
  permissoesParaEnviar,
  permissoesQuePodeConceder,
  validarNovoUsuario,
  type FormularioDeUsuario,
} from '../../../lib/usuarios'
import { useAcoesDeUsuario } from './useUsuarios'

// Formularios "Novo usuario" e "Editar" (spec, 11.5): cartao com borda brand, raio 14, fecha com Cancelar.
// `usuario` nulo = criar; com valor = editar (so o nome e as permissoes mudam; e-mail e papel ficam so como texto).
export function FormularioDeUsuarioCartao({ ator, usuario, aoFechar }: { ator: Usuario; usuario: Usuario | null; aoFechar: () => void }) {
  const editando = usuario !== null
  const papeis = papeisQuePodeCriar(ator)
  const acoes = useAcoesDeUsuario()
  const mutacao = editando ? acoes.alterar : acoes.criar
  const idPapel = useId()
  const idPermissoes = useId()

  const [formulario, setFormulario] = useState<FormularioDeUsuario>({
    nome: usuario?.nome ?? '',
    email: usuario?.email ?? '',
    senha: '',
    papel: usuario?.papel ?? papeis[0] ?? 'Funcionario',
    permissoes: usuario ? [...usuario.permissoes] : [],
  })

  const atualizar = (parcial: Partial<FormularioDeUsuario>) => {
    mutacao.reset()
    setFormulario((atual) => ({ ...atual, ...parcial }))
  }

  const erros = editando ? (formulario.nome.trim() === '' ? { nome: 'Informe o nome.' } : {}) : validarNovoUsuario(formulario)
  const valido = Object.keys(erros).length === 0

  // 409 (e-mail ja existe) abaixo do campo E-mail. 403 aparece no banner global da area de conteudo (nao repete aqui).
  const erroDaApi = mutacao.isError ? mutacao.error : null
  const erroNoEmail = erroDaApi && ehApiError(erroDaApi) && erroDaApi.status === 409 ? erroDaApi.message : null
  const erroNoBanner = erroDaApi && !erroNoEmail && !(ehApiError(erroDaApi) && erroDaApi.status === 403) ? erroDaApi.message : null

  const papelEmUso: Papel = editando ? usuario.papel : formulario.papel
  const superuser = ehSuperuser(papelEmUso)
  // criar: so as permissoes que quem cria possui; editar: todas, com as que nao pode acrescentar desabilitadas
  const permissoesListadas: Permissao[] = editando ? [...PERMISSOES] : permissoesQuePodeConceder(ator)

  function alternar(permissao: Permissao) {
    atualizar({ permissoes: formulario.permissoes.includes(permissao) ? formulario.permissoes.filter((p) => p !== permissao) : [...formulario.permissoes, permissao] })
  }

  function aoEnviar(evento: FormEvent) {
    evento.preventDefault()
    if (!valido) return

    if (editando) {
      acoes.alterar.mutate({ id: usuario.id, dados: { nome: formulario.nome.trim(), permissoes: permissoesParaEnviar(usuario.papel, formulario.permissoes) } }, { onSuccess: aoFechar })
    } else {
      acoes.criar.mutate(
        {
          nome: formulario.nome.trim(),
          email: formulario.email.trim(),
          senha: formulario.senha,
          papel: formulario.papel,
          permissoes: permissoesParaEnviar(formulario.papel, formulario.permissoes),
        },
        { onSuccess: aoFechar },
      )
    }
  }

  return (
    <form
      onSubmit={aoEnviar}
      noValidate
      aria-label={editando ? `Editar ${usuario.nome}` : 'Novo usuário'}
      className="flex flex-col gap-3 rounded-tile border border-brand bg-white px-4 py-[14px]"
    >
      <Field rotulo="Nome" variante="loja" autoComplete="off" value={formulario.nome} onChange={(e) => atualizar({ nome: e.target.value })} />

      {editando ? (
        <dl className="flex flex-col gap-1 text-[14px]">
          <div className="flex gap-2">
            <dt className="font-bold">E-mail</dt>
            <dd className="text-muted">{usuario.email}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-bold">Papel</dt>
            <dd className="text-muted">{rotuloDoPapel(usuario.papel)}</dd>
          </div>
        </dl>
      ) : (
        <>
          <Field
            rotulo="E-mail"
            variante="loja"
            type="email"
            autoComplete="off"
            value={formulario.email}
            onChange={(e) => atualizar({ email: e.target.value })}
            erro={erroNoEmail ?? (formulario.email.trim() !== '' ? (erros.email ?? null) : null)}
          />
          <PasswordField
            rotulo="Senha provisória"
            variante="loja"
            senhaNova
            value={formulario.senha}
            onChange={(e) => atualizar({ senha: e.target.value })}
            ajuda="A pessoa troca a senha depois, em Minha conta."
            erro={formulario.senha !== '' ? (erros.senha ?? null) : null}
          />

          {papeis.length > 1 ? (
            <div role="group" aria-labelledby={idPapel} className="flex flex-col gap-[6px]">
              <span id={idPapel} className="text-[14px] font-bold">
                Papel
              </span>
              <div className="flex flex-wrap gap-2">
                {papeis.map((papel) => (
                  <ChoiceButton key={papel} ativo={formulario.papel === papel} altura={40} raio="loja" onClick={() => atualizar({ papel })}>
                    {rotuloDoPapel(papel)}
                  </ChoiceButton>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[14px]">
              <span className="font-bold">Papel</span> <span className="text-muted">{rotuloDoPapel(papeis[0] ?? 'Funcionario')}</span>
            </p>
          )}
        </>
      )}

      <div role="group" aria-labelledby={idPermissoes} className="flex flex-col gap-1">
        <span id={idPermissoes} className="text-[14px] font-bold">
          Permissões
        </span>
        {superuser ? (
          <p className="text-[13px] text-muted">Superuser tem todas as permissões.</p>
        ) : permissoesListadas.length === 0 ? (
          <p className="text-[13px] text-muted">Você não tem permissões para conceder.</p>
        ) : (
          permissoesListadas.map((permissao) => {
            const habilitada = editando ? permissaoEditavel(ator, permissao, usuario.permissoes) : true
            return (
              <ListCheckbox
                key={permissao}
                marcado={formulario.permissoes.includes(permissao)}
                desabilitado={!habilitada}
                onAlternar={() => alternar(permissao)}
                aria-label={rotuloDaPermissao(permissao)}
              >
                <span className="block">{rotuloDaPermissao(permissao)}</span>
                <span className="block text-[12px] font-normal text-muted">{permissao}</span>
              </ListCheckbox>
            )
          })
        )}
      </div>

      {erroNoBanner ? <Banner tipo="erro">{erroNoBanner}</Banner> : null}

      <div className="flex justify-end gap-2 pt-1">
        <Button variante="outline" altura={44} onClick={aoFechar}>
          Cancelar
        </Button>
        <Button type="submit" variante="primary-ink" altura={44} disabled={!valido} ocupado={mutacao.isPending} rotuloOcupado="Salvando...">
          {editando ? 'Salvar' : 'Criar usuário'}
        </Button>
      </div>
    </form>
  )
}
