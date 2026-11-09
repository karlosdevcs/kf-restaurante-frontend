import { PERMISSOES, type Papel, type Permissao, type Usuario } from '../api/tipos'

// Regras da gestao de usuarios que o front espelha (spec, 11.5). A API e a autoridade: ela recusa (403) o que a
// hierarquia nao permite. O front so evita oferecer a acao.

type Ator = Pick<Usuario, 'id' | 'papel' | 'ativo' | 'permissoes'>

// Superuser cria qualquer papel; Dono so cria Funcionario; Funcionario nao cria ninguem
export function papeisQuePodeCriar(ator: Pick<Usuario, 'papel'>): Papel[] {
  if (ator.papel === 'Superuser') return ['Funcionario', 'Dono', 'Superuser']
  if (ator.papel === 'Dono') return ['Funcionario']
  return []
}

// gerenciar = editar, ativar/desativar e redefinir a senha de OUTRO usuario. Ninguem se gerencia por aqui.
export function podeGerenciar(ator: Ator, alvo: Pick<Usuario, 'id' | 'papel'>): boolean {
  return ator.ativo && alvo.id !== ator.id && papeisQuePodeCriar(ator).includes(alvo.papel)
}

export const ehSuperuser = (papel: Papel) => papel === 'Superuser'

// permissoes que quem cria pode conceder: as que tem (superuser tem todas)
export function permissoesQuePodeConceder(ator: Pick<Usuario, 'papel' | 'permissoes'>): Permissao[] {
  if (ator.papel === 'Superuser') return [...PERMISSOES]
  return PERMISSOES.filter((permissao) => ator.permissoes.includes(permissao))
}

// Na edicao, manter uma permissao que a pessoa ja tinha e sempre permitido; ACRESCENTAR exige que quem edita a tenha.
// Logo, o checkbox fica habilitado se quem edita tem a permissao OU o usuario editado ja a tinha.
export function permissaoEditavel(ator: Pick<Usuario, 'papel' | 'permissoes'>, permissao: Permissao, permissoesDoEditado: readonly Permissao[]): boolean {
  return ator.papel === 'Superuser' || ator.permissoes.includes(permissao) || permissoesDoEditado.includes(permissao)
}

// Mesmos limites e textos da API; a mensagem nunca repete a senha digitada.
export function validarSenha(senha: string): string | null {
  if (senha.trim() === '' || senha.length < 8) return 'A senha deve ter no mínimo 8 caracteres.'
  if (senha.length > 128) return 'A senha deve ter no máximo 128 caracteres.'
  return null
}

const FORMATO_DE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface FormularioDeUsuario {
  nome: string
  email: string
  senha: string
  papel: Papel
  permissoes: Permissao[]
}

export interface ErrosDoUsuario {
  nome?: string
  email?: string
  senha?: string
}

export function validarNovoUsuario(formulario: FormularioDeUsuario): ErrosDoUsuario {
  const erros: ErrosDoUsuario = {}
  if (formulario.nome.trim() === '') erros.nome = 'Informe o nome.'
  if (!FORMATO_DE_EMAIL.test(formulario.email.trim())) erros.email = 'Informe um e-mail válido.'
  const senha = validarSenha(formulario.senha)
  if (senha) erros.senha = senha
  return erros
}

// Superuser sempre tem todas as permissoes: nao se envia lista para ele
export function permissoesParaEnviar(papel: Papel, permissoes: readonly Permissao[]): Permissao[] {
  return ehSuperuser(papel) ? [] : PERMISSOES.filter((permissao) => permissoes.includes(permissao))
}
