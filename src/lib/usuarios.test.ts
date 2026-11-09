import type { Usuario } from '../api/tipos'
import {
  papeisQuePodeCriar,
  permissaoEditavel,
  permissoesParaEnviar,
  permissoesQuePodeConceder,
  podeGerenciar,
  validarNovoUsuario,
  validarSenha,
  type FormularioDeUsuario,
} from './usuarios'

const ator = (papel: Usuario['papel'], permissoes: Usuario['permissoes'] = [], extra: Partial<Usuario> = {}): Usuario => ({
  id: 1,
  nome: 'Ator',
  email: 'ator@teste.local',
  papel,
  ativo: true,
  permissoes,
  ...extra,
})

describe('hierarquia', () => {
  it('superuser cria qualquer papel; dono so funcionario; funcionario ninguem', () => {
    expect(papeisQuePodeCriar(ator('Superuser'))).toEqual(['Funcionario', 'Dono', 'Superuser'])
    expect(papeisQuePodeCriar(ator('Dono'))).toEqual(['Funcionario'])
    expect(papeisQuePodeCriar(ator('Funcionario'))).toEqual([])
  })

  it('dono gerencia so funcionarios; superuser gerencia todos; ninguem gerencia a si mesmo', () => {
    const funcionario = { id: 2, papel: 'Funcionario' } as const
    const dono = { id: 3, papel: 'Dono' } as const
    const superuser = { id: 4, papel: 'Superuser' } as const

    expect(podeGerenciar(ator('Dono'), funcionario)).toBe(true)
    expect(podeGerenciar(ator('Dono'), dono)).toBe(false)
    expect(podeGerenciar(ator('Dono'), superuser)).toBe(false)
    expect(podeGerenciar(ator('Superuser'), funcionario)).toBe(true)
    expect(podeGerenciar(ator('Superuser'), dono)).toBe(true)
    expect(podeGerenciar(ator('Superuser'), superuser)).toBe(true)
    expect(podeGerenciar(ator('Superuser'), { id: 1, papel: 'Funcionario' })).toBe(false) // a si mesmo
    expect(podeGerenciar(ator('Funcionario'), funcionario)).toBe(false)
    expect(podeGerenciar(ator('Dono', [], { ativo: false }), funcionario)).toBe(false)
  })
})

describe('permissoes', () => {
  it('superuser concede todas; dono so as que tem', () => {
    expect(permissoesQuePodeConceder(ator('Superuser'))).toHaveLength(6)
    expect(permissoesQuePodeConceder(ator('Dono', ['VerPedidos', 'AbrirFecharLoja']))).toEqual(['VerPedidos', 'AbrirFecharLoja'])
  })

  it('checkbox na edicao: habilitado se quem edita tem a permissao OU o editado ja a tinha', () => {
    const dono = ator('Dono', ['VerPedidos'])

    expect(permissaoEditavel(dono, 'VerPedidos', [])).toBe(true) // tem
    expect(permissaoEditavel(dono, 'GerenciarCardapio', [])).toBe(false) // nao tem e o editado tambem nao
    expect(permissaoEditavel(dono, 'GerenciarCardapio', ['GerenciarCardapio'])).toBe(true) // manter e sempre permitido
    expect(permissaoEditavel(ator('Superuser'), 'GerenciarCardapio', [])).toBe(true)
  })

  it('so se envia permissoes para quem nao e superuser, na ordem do contrato', () => {
    expect(permissoesParaEnviar('Funcionario', ['AbrirFecharLoja', 'VerPedidos'])).toEqual(['VerPedidos', 'AbrirFecharLoja'])
    expect(permissoesParaEnviar('Superuser', ['VerPedidos'])).toEqual([])
  })
})

describe('validacao', () => {
  it('senha de 8 a 128 caracteres, com as mensagens da API que nunca repetem a senha', () => {
    expect(validarSenha('1234567')).toBe('A senha deve ter no mínimo 8 caracteres.')
    expect(validarSenha('   ')).toBe('A senha deve ter no mínimo 8 caracteres.')
    expect(validarSenha('12345678')).toBeNull()
    expect(validarSenha('a'.repeat(128))).toBeNull()
    expect(validarSenha('a'.repeat(129))).toBe('A senha deve ter no máximo 128 caracteres.')
    expect(validarSenha('segred1')).not.toContain('segred1') // a mensagem nunca repete a senha digitada
  })

  it('novo usuario: nome, e-mail e senha', () => {
    const base: FormularioDeUsuario = { nome: 'Ana', email: 'ana@teste.local', senha: 'senha-boa-1', papel: 'Funcionario', permissoes: [] }

    expect(validarNovoUsuario(base)).toEqual({})
    expect(validarNovoUsuario({ ...base, nome: ' ' }).nome).toBeDefined()
    expect(validarNovoUsuario({ ...base, email: 'ana' }).email).toBe('Informe um e-mail válido.')
    expect(validarNovoUsuario({ ...base, senha: 'curta' }).senha).toBeDefined()
  })
})
