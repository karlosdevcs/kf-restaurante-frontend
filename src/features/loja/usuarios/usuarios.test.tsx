import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Papel, Permissao, Usuario } from '../../../api/tipos'
import { criarUsuario, guardarSessao, renderizarLoja, responderEu } from '../../../test/loja'
import { definirDesktop, removerMatchMedia } from '../../../test/matchMedia'
import { servirLoja } from '../../../test/pedidos'
import { servirUsuarios, usuario } from '../../../test/usuarios'

afterEach(() => removerMatchMedia())

// quem esta logado (id 1) aparece na propria lista, como na API
function logado(papel: Papel, permissoes: Permissao[] = []): Usuario {
  return criarUsuario({ id: 1, nome: 'Dono Teste', email: 'dono@teste.local', papel, permissoes })
}

async function abrirUsuarios(ator: Usuario, outros: Usuario[], desktop = true) {
  definirDesktop(desktop)
  guardarSessao()
  servirLoja()
  responderEu(() => ator)
  const cenario = servirUsuarios({ usuarios: [ator, ...outros] })
  const retorno = renderizarLoja('/loja/usuarios')
  await screen.findByRole('heading', { name: 'Usuários' })
  await screen.findByText(ator.nome)
  return { cenario, ...retorno }
}

const linha = (nome: string) => within(screen.getByRole('row', { name: new RegExp(nome) }))

describe('lista de usuarios', () => {
  it('colunas, marca "Voce" e so "Minha conta" na propria linha; as outras tem as tres acoes', async () => {
    const ana = usuario(2, 'Ana', { permissoes: ['VerPedidos', 'AbrirFecharLoja'] })
    await abrirUsuarios(logado('Dono', ['VerPedidos']), [ana])

    expect(screen.getAllByRole('columnheader').map((c) => c.textContent)).toEqual(['Nome', 'E-mail', 'Papel', 'Permissões', 'Situação', 'Ações'])

    const propria = linha('Dono Teste')
    expect(propria.getByText('Você')).toBeInTheDocument()
    expect(propria.getByRole('button', { name: 'Minha conta' })).toBeInTheDocument()
    expect(propria.queryByRole('button', { name: /Desativar|Redefinir|Editar/ })).not.toBeInTheDocument() // ninguem desativa a si mesmo

    const outra = linha('Ana')
    expect(outra.getByText('Funcionário')).toBeInTheDocument()
    expect(outra.getByText('Ver pedidos')).toBeInTheDocument()
    expect(outra.getByText('Abrir e fechar a loja')).toBeInTheDocument()
    expect(outra.getByText('Ativo')).toBeInTheDocument()
    expect(outra.getByRole('button', { name: 'Editar Ana' })).toBeInTheDocument()
    expect(outra.getByRole('button', { name: 'Desativar Ana' })).toBeInTheDocument()
    expect(outra.getByRole('button', { name: 'Redefinir senha de Ana' })).toBeInTheDocument()
  })

  it('superuser aparece com "Todas"; inativo mostra "Ativar" em vez de "Desativar"', async () => {
    const outroSuper = usuario(3, 'Chefe', { papel: 'Superuser' })
    const inativa = usuario(4, 'Bia', { ativo: false })
    await abrirUsuarios(logado('Superuser'), [outroSuper, inativa])

    expect(linha('Chefe').getByText('Todas')).toBeInTheDocument()
    expect(linha('Chefe').getByText('Superuser')).toBeInTheDocument()
    expect(linha('Bia').getByText('Inativo')).toBeInTheDocument()
    expect(linha('Bia').getByRole('button', { name: 'Ativar Bia' })).toBeInTheDocument()
    expect(linha('Bia').queryByRole('button', { name: 'Desativar Bia' })).not.toBeInTheDocument()
  })

  it('celular: um cartao por usuario, com as mesmas acoes', async () => {
    await abrirUsuarios(logado('Dono'), [usuario(2, 'Ana')], false)

    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    const cartao = within(screen.getByText('Ana').closest('li') as HTMLElement)
    expect(cartao.getByText('Ativo')).toBeInTheDocument()
    expect(cartao.getByRole('button', { name: 'Editar Ana' })).toBeInTheDocument()
    const propria = within(screen.getByText('Dono Teste').closest('li') as HTMLElement)
    expect(propria.getByRole('button', { name: 'Minha conta' })).toBeInTheDocument()
  })

  it('"Minha conta" na propria linha abre /loja/conta', async () => {
    const { roteador } = await abrirUsuarios(logado('Dono'), [])

    await userEvent.click(linha('Dono Teste').getByRole('button', { name: 'Minha conta' }))

    expect(await screen.findByRole('heading', { name: 'Minha conta' })).toBeInTheDocument()
    expect(roteador.state.location.pathname).toBe('/loja/conta')
  })
})

describe('criar usuario', () => {
  it('dono so cria Funcionario (texto fixo, sem seletor) e so concede as permissoes que tem', async () => {
    await abrirUsuarios(logado('Dono', ['VerPedidos', 'AbrirFecharLoja']), [])
    await userEvent.click(screen.getByRole('button', { name: 'Novo usuário' }))
    const form = within(screen.getByRole('form', { name: 'Novo usuário' }))

    expect(form.getByText('Funcionário')).toBeInTheDocument()
    expect(form.queryByRole('button', { name: 'Dono' })).not.toBeInTheDocument()
    expect(form.queryByRole('button', { name: 'Superuser' })).not.toBeInTheDocument()
    expect(form.getAllByRole('checkbox').map((c) => c.getAttribute('aria-label'))).toEqual(['Ver pedidos', 'Abrir e fechar a loja'])
    expect(form.getByText('VerPedidos')).toBeInTheDocument() // nome tecnico em texto pequeno
    expect(form.getByText('A pessoa troca a senha depois, em Minha conta.')).toBeInTheDocument()
  })

  it('cria com nome, e-mail, senha provisoria, papel e permissoes; a lista atualiza e o formulario fecha', async () => {
    const { cenario } = await abrirUsuarios(logado('Dono', ['VerPedidos', 'AbrirFecharLoja']), [])
    await userEvent.click(screen.getByRole('button', { name: 'Novo usuário' }))
    const form = within(screen.getByRole('form', { name: 'Novo usuário' }))
    expect(form.getByRole('button', { name: 'Criar usuário' })).toBeDisabled()

    await userEvent.type(form.getByLabelText('Nome'), 'Carla')
    await userEvent.type(form.getByLabelText('E-mail'), 'Carla@Teste.local')
    await userEvent.type(form.getByLabelText('Senha provisória'), 'provisoria-1')
    await userEvent.click(form.getByRole('checkbox', { name: 'Ver pedidos' }))
    await userEvent.click(form.getByRole('button', { name: 'Criar usuário' }))

    expect(await screen.findByRole('row', { name: /Carla/ })).toBeInTheDocument()
    expect(cenario.chamadas.criados).toEqual([{ nome: 'Carla', email: 'Carla@Teste.local', senha: 'provisoria-1', papel: 'Funcionario', permissoes: ['VerPedidos'] }])
    expect(screen.queryByRole('form', { name: 'Novo usuário' })).not.toBeInTheDocument()
  })

  it('superuser escolhe o papel; Superuser esconde as permissoes e nao envia lista', async () => {
    const { cenario } = await abrirUsuarios(logado('Superuser'), [])
    await userEvent.click(screen.getByRole('button', { name: 'Novo usuário' }))
    const form = within(screen.getByRole('form', { name: 'Novo usuário' }))

    expect(['Funcionário', 'Dono', 'Superuser'].every((papel) => form.getByRole('button', { name: papel }))).toBe(true)
    expect(form.getAllByRole('checkbox')).toHaveLength(6) // superuser concede todas

    await userEvent.click(form.getByRole('button', { name: 'Superuser' }))
    expect(form.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(form.getByText('Superuser tem todas as permissões.')).toBeInTheDocument()

    await userEvent.type(form.getByLabelText('Nome'), 'Chefe 2')
    await userEvent.type(form.getByLabelText('E-mail'), 'chefe2@teste.local')
    await userEvent.type(form.getByLabelText('Senha provisória'), 'provisoria-1')
    await userEvent.click(form.getByRole('button', { name: 'Criar usuário' }))

    await waitFor(() => expect(cenario.chamadas.criados).toHaveLength(1))
    expect(cenario.chamadas.criados[0]).toMatchObject({ papel: 'Superuser', permissoes: [] })
  })

  it('senha provisoria curta: mensagem da API, sem repetir a senha, e o botao fica desabilitado', async () => {
    await abrirUsuarios(logado('Dono'), [])
    await userEvent.click(screen.getByRole('button', { name: 'Novo usuário' }))
    const form = within(screen.getByRole('form', { name: 'Novo usuário' }))

    await userEvent.type(form.getByLabelText('Nome'), 'Carla')
    await userEvent.type(form.getByLabelText('E-mail'), 'carla@teste.local')
    await userEvent.type(form.getByLabelText('Senha provisória'), 'curta12')

    expect(form.getByText('A senha deve ter no mínimo 8 caracteres.')).toBeInTheDocument()
    expect(screen.queryByText(/curta12/)).not.toBeInTheDocument()
    expect(form.getByRole('button', { name: 'Criar usuário' })).toBeDisabled()
  })

  it('e-mail duplicado (409) aparece abaixo do campo E-mail', async () => {
    const { cenario } = await abrirUsuarios(logado('Dono'), [])
    cenario.recusarCriacao = { status: 409, detail: "Já existe um usuário com o e-mail 'carla@teste.local'." }
    await userEvent.click(screen.getByRole('button', { name: 'Novo usuário' }))
    const form = within(screen.getByRole('form', { name: 'Novo usuário' }))

    await userEvent.type(form.getByLabelText('Nome'), 'Carla')
    await userEvent.type(form.getByLabelText('E-mail'), 'carla@teste.local')
    await userEvent.type(form.getByLabelText('Senha provisória'), 'provisoria-1')
    await userEvent.click(form.getByRole('button', { name: 'Criar usuário' }))

    const alerta = await form.findByText("Já existe um usuário com o e-mail 'carla@teste.local'.")
    expect(form.getByLabelText('E-mail')).toHaveAttribute('aria-describedby', alerta.id)
    expect(screen.getByRole('form', { name: 'Novo usuário' })).toBeInTheDocument()
  })

  it('403 (conceder o que nao tem) aparece no banner da area, sem derrubar a sessao', async () => {
    const { cenario } = await abrirUsuarios(logado('Dono', ['VerPedidos']), [])
    cenario.recusarCriacao = { status: 403, detail: 'Você não pode conceder permissões que não possui: GerenciarCardapio.' }
    await userEvent.click(screen.getByRole('button', { name: 'Novo usuário' }))
    const form = within(screen.getByRole('form', { name: 'Novo usuário' }))

    await userEvent.type(form.getByLabelText('Nome'), 'Carla')
    await userEvent.type(form.getByLabelText('E-mail'), 'carla@teste.local')
    await userEvent.type(form.getByLabelText('Senha provisória'), 'provisoria-1')
    await userEvent.click(form.getByRole('button', { name: 'Criar usuário' }))

    expect(await screen.findByText('Você não pode conceder permissões que não possui: GerenciarCardapio.')).toBeInTheDocument()
    expect(sessionStorage.getItem('kf:sessao')).not.toBeNull()
  })
})

describe('editar usuario', () => {
  it('checkbox habilitado se quem edita tem a permissao OU o editado ja a tinha; manter e sempre permitido', async () => {
    const ana = usuario(2, 'Ana', { permissoes: ['VerPedidos', 'GerenciarCardapio'] })
    const { cenario } = await abrirUsuarios(logado('Dono', ['VerPedidos', 'AbrirFecharLoja']), [ana])
    await userEvent.click(linha('Ana').getByRole('button', { name: 'Editar Ana' }))
    const form = within(screen.getByRole('form', { name: 'Editar Ana' }))

    expect(form.getByRole('checkbox', { name: 'Ver pedidos' })).toBeEnabled() // o dono tem
    expect(form.getByRole('checkbox', { name: 'Abrir e fechar a loja' })).toBeEnabled() // o dono tem
    expect(form.getByRole('checkbox', { name: 'Montar e publicar o cardápio' })).toBeEnabled() // o dono NAO tem, mas Ana ja tinha
    expect(form.getByRole('checkbox', { name: 'Gerenciar opções e tamanhos' })).toBeDisabled() // nenhum dos dois tem
    expect(form.getByRole('checkbox', { name: 'Montar e publicar o cardápio' })).toHaveAttribute('aria-checked', 'true')

    await userEvent.click(form.getByRole('checkbox', { name: 'Abrir e fechar a loja' }))
    await userEvent.clear(form.getByLabelText('Nome'))
    await userEvent.type(form.getByLabelText('Nome'), 'Ana Maria')
    await userEvent.click(form.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(cenario.chamadas.alterados).toHaveLength(1))
    // a lista SUBSTITUI a atual: a permissao mantida (Montar e publicar) segue na lista enviada
    expect(cenario.chamadas.alterados[0]).toEqual({ id: 2, corpo: { nome: 'Ana Maria', permissoes: ['VerPedidos', 'AbrirFecharLoja', 'GerenciarCardapio'] } })
    expect(await screen.findByRole('row', { name: /Ana Maria/ })).toBeInTheDocument()
  })

  it('e-mail e papel aparecem so como texto na edicao', async () => {
    await abrirUsuarios(logado('Dono'), [usuario(2, 'Ana')])
    await userEvent.click(linha('Ana').getByRole('button', { name: 'Editar Ana' }))
    const form = within(screen.getByRole('form', { name: 'Editar Ana' }))

    expect(form.getByText('ana@teste.local')).toBeInTheDocument()
    expect(form.queryByLabelText('E-mail')).not.toBeInTheDocument()
    expect(form.queryByLabelText('Senha provisória')).not.toBeInTheDocument()
  })

  it('permissoes de um superuser nao sao editaveis (so o nome)', async () => {
    await abrirUsuarios(logado('Superuser'), [usuario(3, 'Chefe', { papel: 'Superuser' })])
    await userEvent.click(linha('Chefe').getByRole('button', { name: 'Editar Chefe' }))
    const form = within(screen.getByRole('form', { name: 'Editar Chefe' }))

    expect(form.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(form.getByText('Superuser tem todas as permissões.')).toBeInTheDocument()
  })
})

describe('ativar, desativar e redefinir senha', () => {
  it('desativar pede confirmacao ("A pessoa perde o acesso na hora."); Cancelar nao chama a API', async () => {
    const { cenario } = await abrirUsuarios(logado('Dono'), [usuario(2, 'Ana')])
    await userEvent.click(linha('Ana').getByRole('button', { name: 'Desativar Ana' }))

    const dialogo = within(screen.getByRole('dialog', { name: 'Desativar Ana?' }))
    expect(dialogo.getByText('A pessoa perde o acesso na hora.')).toBeInTheDocument()

    await userEvent.click(dialogo.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(cenario.chamadas.desativados).toEqual([])
  })

  it('confirmar desativa e a linha vira Inativo; Ativar nao pede confirmacao', async () => {
    const { cenario } = await abrirUsuarios(logado('Dono'), [usuario(2, 'Ana')])
    await userEvent.click(linha('Ana').getByRole('button', { name: 'Desativar Ana' }))

    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Desativar' }))

    expect(await within(await screen.findByRole('row', { name: /Ana/ })).findByText('Inativo')).toBeInTheDocument()
    expect(cenario.chamadas.desativados).toEqual([2])
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await userEvent.click(linha('Ana').getByRole('button', { name: 'Ativar Ana' }))

    expect(await within(await screen.findByRole('row', { name: /Ana/ })).findByText('Ativo')).toBeInTheDocument()
    expect(cenario.chamadas.ativados).toEqual([2])
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument() // ativar nao abre dialogo
  })

  it('redefinir senha: valida 8 a 128, envia e mostra "A conta tambem foi destravada."', async () => {
    const { cenario } = await abrirUsuarios(logado('Dono'), [usuario(2, 'Ana')])
    await userEvent.click(linha('Ana').getByRole('button', { name: 'Redefinir senha de Ana' }))
    const dialogo = within(screen.getByRole('dialog'))

    await userEvent.type(dialogo.getByLabelText('Nova senha'), 'curta')
    await userEvent.click(dialogo.getByRole('button', { name: 'Redefinir' }))
    expect(dialogo.getByText('A senha deve ter no mínimo 8 caracteres.')).toBeInTheDocument()
    expect(cenario.chamadas.senhas).toEqual([])

    await userEvent.clear(dialogo.getByLabelText('Nova senha'))
    await userEvent.type(dialogo.getByLabelText('Nova senha'), 'senha-nova-123')
    await userEvent.click(dialogo.getByRole('button', { name: 'Redefinir' }))

    expect(await screen.findByText('Senha redefinida. A conta também foi destravada.')).toBeInTheDocument()
    expect(cenario.chamadas.senhas).toEqual([{ id: 2, novaSenha: 'senha-nova-123' }])
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
