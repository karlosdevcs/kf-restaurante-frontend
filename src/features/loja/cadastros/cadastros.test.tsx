import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { formatBRL } from '../../../lib/formatar'
import { servirCadastros } from '../../../test/cadastros'
import { criarUsuario, guardarSessao, renderizarLoja, responderEu } from '../../../test/loja'
import { definirDesktop, removerMatchMedia } from '../../../test/matchMedia'
import { servirLoja } from '../../../test/pedidos'

afterEach(() => removerMatchMedia())

const brl = (valor: number) => formatBRL(valor).replace(/\s/g, ' ')

async function abrirCadastros(desktop = true) {
  definirDesktop(desktop)
  guardarSessao()
  responderEu(() => criarUsuario({ permissoes: ['GerenciarCadastros'] }))
  const retorno = renderizarLoja('/loja/cadastros')
  await screen.findByRole('heading', { name: 'Opções' })
  return retorno
}

const secaoDeOpcoes = () => within(screen.getByRole('region', { name: 'Opções' }))
const secaoDeTamanhos = () => within(screen.getByRole('region', { name: 'Tamanhos' }))

describe('lista de opcoes e tamanhos', () => {
  it('computador: as duas lado a lado; tabela com preco ou "componente"; cartoes de tamanho com os limites', async () => {
    servirLoja()
    servirCadastros()
    await abrirCadastros()

    expect(await screen.findByRole('row', { name: /Carne 1/ })).toBeInTheDocument()
    expect(screen.getAllByRole('columnheader').map((c) => c.textContent)).toEqual(['Nome', 'Categoria', 'Preço', 'Ações'])
    expect(within(screen.getByRole('row', { name: /Carne 1/ })).getByText('componente')).toBeInTheDocument()
    expect(within(screen.getByRole('row', { name: /Bebida 1/ })).getByText(brl(6))).toBeInTheDocument()
    expect(within(screen.getByRole('row', { name: /Prato 1/ })).getByText(brl(25))).toBeInTheDocument() // componente vendido avulso

    const tamanhos = secaoDeTamanhos()
    expect(await tamanhos.findByRole('heading', { name: 'Marmita M' })).toBeInTheDocument()
    expect(tamanhos.getByText(brl(20))).toBeInTheDocument()
    expect(tamanhos.getByText('até 3 itens')).toBeInTheDocument()
    expect(tamanhos.getByText('Carne: até 1')).toBeInTheDocument()
    expect(tamanhos.getByText('Salada: não incluso')).toBeInTheDocument()
    expect(tamanhos.getByText('até 4 itens')).toBeInTheDocument()
  })

  it('celular: duas ChoiceButton alternam entre Opcoes e Tamanhos', async () => {
    servirLoja()
    servirCadastros()
    await abrirCadastros(false)

    expect(await screen.findByText('Carne 1')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Tamanhos' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Tamanhos' }))

    expect(await screen.findByRole('heading', { name: 'Marmita M' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Opções' })).not.toBeInTheDocument()
  })
})

describe('criar e editar opcao', () => {
  async function abrirFormulario() {
    servirLoja()
    const cenario = servirCadastros()
    await abrirCadastros()
    await screen.findByRole('row', { name: /Carne 1/ })
    await userEvent.click(secaoDeOpcoes().getByRole('button', { name: 'Nova opção' }))
    return { cenario, form: within(screen.getByRole('form', { name: 'Nova opção' })) }
  }

  it('"Salvar opcao" so habilita com o formulario valido', async () => {
    const { form } = await abrirFormulario()
    const salvar = form.getByRole('button', { name: 'Salvar opção' })

    expect(salvar).toBeDisabled()
    await userEvent.type(form.getByLabelText('Nome'), 'Strogonoff')
    expect(salvar).toBeEnabled()
  })

  it('componente: preco escondido; "Vender tambem avulsa" mostra o campo e o texto de apoio some', async () => {
    const { form } = await abrirFormulario()

    expect(form.getByText('Componente de marmita não tem preço próprio. Entra no preço do tamanho.')).toBeInTheDocument()
    expect(form.queryByLabelText('Preço')).not.toBeInTheDocument()

    await userEvent.click(form.getByRole('checkbox', { name: 'Vender também avulsa' }))

    expect(form.getByLabelText('Preço')).toBeInTheDocument()
    expect(form.queryByText('Componente de marmita não tem preço próprio. Entra no preço do tamanho.')).not.toBeInTheDocument()
  })

  it('Bebida e Sobremesa exigem preco (sem a caixa "Vender tambem avulsa")', async () => {
    const { form } = await abrirFormulario()
    await userEvent.type(form.getByLabelText('Nome'), 'Suco')

    await userEvent.click(form.getByRole('button', { name: 'Bebida' }))

    expect(form.queryByRole('checkbox', { name: 'Vender também avulsa' })).not.toBeInTheDocument()
    expect(form.getByLabelText('Preço')).toBeInTheDocument()
    expect(form.getByRole('button', { name: 'Salvar opção' })).toBeDisabled() // falta o preco

    await userEvent.type(form.getByLabelText('Preço'), '-2')
    expect(form.getByText('Informe um preço válido, igual ou maior que zero.')).toBeInTheDocument()
    expect(form.getByRole('button', { name: 'Salvar opção' })).toBeDisabled()

    await userEvent.clear(form.getByLabelText('Preço'))
    await userEvent.type(form.getByLabelText('Preço'), '6,5')
    expect(form.getByRole('button', { name: 'Salvar opção' })).toBeEnabled()
  })

  it('criar um componente sem preco envia preco nulo, fecha o formulario e atualiza a lista', async () => {
    const { cenario, form } = await abrirFormulario()

    await userEvent.type(form.getByLabelText('Nome'), 'Strogonoff')
    await userEvent.click(form.getByRole('button', { name: 'Salvar opção' }))

    expect(await screen.findByRole('row', { name: /Strogonoff/ })).toBeInTheDocument()
    expect(cenario.chamadas.opcoes).toEqual([{ metodo: 'POST', id: null, corpo: { nome: 'Strogonoff', categoria: 'Carne', preco: null } }])
    expect(screen.queryByRole('form', { name: 'Nova opção' })).not.toBeInTheDocument()
  })

  it('criar uma bebida envia o preco como numero', async () => {
    const { cenario, form } = await abrirFormulario()

    await userEvent.type(form.getByLabelText('Nome'), 'Suco')
    await userEvent.click(form.getByRole('button', { name: 'Bebida' }))
    await userEvent.type(form.getByLabelText('Preço'), '6,50')
    await userEvent.click(form.getByRole('button', { name: 'Salvar opção' }))

    await waitFor(() => expect(cenario.chamadas.opcoes).toEqual([{ metodo: 'POST', id: null, corpo: { nome: 'Suco', categoria: 'Bebida', preco: 6.5 } }]))
  })

  it('409 (nome ja existe) aparece abaixo do campo Nome e o formulario continua aberto', async () => {
    const { cenario, form } = await abrirFormulario()
    cenario.recusarOpcao = { status: 409, detail: 'Já existe uma opção com o nome Carne 1.' }

    await userEvent.type(form.getByLabelText('Nome'), 'Carne 1')
    await userEvent.click(form.getByRole('button', { name: 'Salvar opção' }))

    const alerta = await form.findByText('Já existe uma opção com o nome Carne 1.')
    expect(form.getByLabelText('Nome')).toHaveAttribute('aria-describedby', alerta.id)
    expect(screen.getByRole('form', { name: 'Nova opção' })).toBeInTheDocument()
  })

  it('400 aparece num Banner dentro do formulario', async () => {
    const { cenario, form } = await abrirFormulario()
    cenario.recusarOpcao = { status: 400, detail: 'O preço não pode ser negativo.' }

    await userEvent.type(form.getByLabelText('Nome'), 'Qualquer')
    await userEvent.click(form.getByRole('button', { name: 'Salvar opção' }))

    expect(await form.findByRole('alert')).toHaveTextContent('O preço não pode ser negativo.')
  })

  it('Cancelar fecha sem chamar a API', async () => {
    const { cenario, form } = await abrirFormulario()

    await userEvent.click(form.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('form', { name: 'Nova opção' })).not.toBeInTheDocument()
    expect(cenario.chamadas.opcoes).toEqual([])
  })

  it('editar abre o formulario preenchido e envia PUT /opcoes/{id}', async () => {
    servirLoja()
    const cenario = servirCadastros()
    await abrirCadastros()
    await userEvent.click(await screen.findByRole('button', { name: 'Editar Prato 1' }))

    const form = within(screen.getByRole('form', { name: 'Editar Prato 1' }))
    expect(form.getByLabelText('Nome')).toHaveValue('Prato 1')
    expect(form.getByRole('button', { name: 'Carne' })).toHaveAttribute('aria-pressed', 'true')
    expect(form.getByRole('checkbox', { name: 'Vender também avulsa' })).toHaveAttribute('aria-checked', 'true') // tinha preco
    expect(form.getByLabelText('Preço')).toHaveValue('25,00')

    await userEvent.clear(form.getByLabelText('Nome'))
    await userEvent.type(form.getByLabelText('Nome'), 'Prato do dia')
    await userEvent.clear(form.getByLabelText('Preço'))
    await userEvent.type(form.getByLabelText('Preço'), '27')
    await userEvent.click(form.getByRole('button', { name: 'Salvar opção' }))

    expect(await screen.findByRole('row', { name: /Prato do dia/ })).toBeInTheDocument()
    expect(cenario.chamadas.opcoes).toEqual([{ metodo: 'PUT', id: 4, corpo: { nome: 'Prato do dia', categoria: 'Carne', preco: 27 } }])
  })

  it('desmarcar "Vender tambem avulsa" ao editar volta o preco para nulo', async () => {
    servirLoja()
    const cenario = servirCadastros()
    await abrirCadastros()
    await userEvent.click(await screen.findByRole('button', { name: 'Editar Prato 1' }))
    const form = within(screen.getByRole('form', { name: 'Editar Prato 1' }))

    await userEvent.click(form.getByRole('checkbox', { name: 'Vender também avulsa' }))
    await userEvent.click(form.getByRole('button', { name: 'Salvar opção' }))

    await waitFor(() => expect(cenario.chamadas.opcoes[0]?.corpo.preco).toBeNull())
  })

  it('celular: a grade de categorias usa o rotulo curto "Acomp."', async () => {
    servirLoja()
    servirCadastros()
    await abrirCadastros(false)
    await userEvent.click(await screen.findByRole('button', { name: 'Nova opção' }))

    expect(within(screen.getByRole('form', { name: 'Nova opção' })).getByRole('button', { name: 'Acomp.' })).toBeInTheDocument()
  })
})

describe('criar e editar tamanho e limites', () => {
  async function abrirTamanhos() {
    servirLoja()
    const cenario = servirCadastros()
    await abrirCadastros()
    await secaoDeTamanhos().findByRole('heading', { name: 'Marmita M' })
    return cenario
  }

  it('criar: nome, preco e limite total; limites so depois de criado', async () => {
    const cenario = await abrirTamanhos()
    await userEvent.click(secaoDeTamanhos().getByRole('button', { name: 'Novo tamanho' }))
    const form = within(screen.getByRole('form', { name: 'Novo tamanho' }))

    expect(form.getByText('Depois de criar o tamanho, edite-o para definir os limites por categoria.')).toBeInTheDocument()
    expect(form.queryByRole('group', { name: /Limites/ })).not.toBeInTheDocument()
    expect(form.getByRole('button', { name: 'Salvar tamanho' })).toBeDisabled()

    await userEvent.type(form.getByLabelText('Nome'), 'P')
    await userEvent.type(form.getByLabelText('Preço'), '15')
    await userEvent.type(form.getByLabelText('Limite total de componentes'), '2')
    await userEvent.click(form.getByRole('button', { name: 'Salvar tamanho' }))

    expect(await secaoDeTamanhos().findByRole('heading', { name: 'Marmita P' })).toBeInTheDocument()
    expect(cenario.chamadas.tamanhos).toEqual([{ metodo: 'POST', id: null, corpo: { nome: 'P', preco: 15, limitedeComponente: 2 } }])
    expect(cenario.chamadas.limites).toEqual([]) // criar nao mexe nos limites
  })

  it('limite total precisa ser inteiro: decimal ou negativo desabilita o botao', async () => {
    await abrirTamanhos()
    await userEvent.click(secaoDeTamanhos().getByRole('button', { name: 'Novo tamanho' }))
    const form = within(screen.getByRole('form', { name: 'Novo tamanho' }))
    await userEvent.type(form.getByLabelText('Nome'), 'P')
    await userEvent.type(form.getByLabelText('Preço'), '15')

    await userEvent.type(form.getByLabelText('Limite total de componentes'), '2,5')
    expect(form.getByText('Informe um número inteiro, igual ou maior que zero.')).toBeInTheDocument()
    expect(form.getByRole('button', { name: 'Salvar tamanho' })).toBeDisabled()

    await userEvent.clear(form.getByLabelText('Limite total de componentes'))
    await userEvent.type(form.getByLabelText('Limite total de componentes'), '0')
    expect(form.getByRole('button', { name: 'Salvar tamanho' })).toBeEnabled()
  })

  it('editar mostra os limites atuais; salvar envia o tamanho e SUBSTITUI os limites, nessa ordem', async () => {
    const cenario = await abrirTamanhos()
    await userEvent.click(secaoDeTamanhos().getByRole('button', { name: 'Editar Marmita M' }))
    const form = within(screen.getByRole('form', { name: 'Editar Marmita M' }))

    expect(form.getByLabelText('Nome')).toHaveValue('M')
    expect(form.getByLabelText('Preço')).toHaveValue('20,00')
    expect(form.getByLabelText('Limite total de componentes')).toHaveValue('3')
    expect(form.getAllByRole('checkbox').map((c) => c.getAttribute('aria-label'))).toEqual(['Limitar Carne', 'Limitar Acompanhamento', 'Limitar Guarnição', 'Limitar Salada'])
    expect(form.getByRole('checkbox', { name: 'Limitar Carne' })).toHaveAttribute('aria-checked', 'true')
    expect(form.getByRole('checkbox', { name: 'Limitar Acompanhamento' })).toHaveAttribute('aria-checked', 'false')
    expect(form.getByText('Categoria sem limite fica livre, respeitando só o limite total. Porção dupla conta como 2.')).toBeInTheDocument()

    // Carne: 1 -> 2; Salada: deixa de ter limite; Guarnicao: passa a ter (comeca em 1 e vai a 0)
    await userEvent.click(within(form.getByRole('group', { name: 'Máximo de Carne' })).getByRole('button', { name: 'Aumentar quantidade' }))
    await userEvent.click(form.getByRole('checkbox', { name: 'Limitar Salada' }))
    await userEvent.click(form.getByRole('checkbox', { name: 'Limitar Guarnição' }))
    await userEvent.click(within(form.getByRole('group', { name: 'Máximo de Guarnição' })).getByRole('button', { name: 'Diminuir quantidade' }))
    expect(within(form.getByRole('group', { name: 'Máximo de Guarnição' })).getByText('0')).toBeInTheDocument() // zero e permitido
    await userEvent.click(form.getByRole('button', { name: 'Salvar tamanho' }))

    await waitFor(() => expect(cenario.chamadas.limites).toHaveLength(1))
    expect(cenario.chamadas.tamanhos).toEqual([{ metodo: 'PUT', id: 2, corpo: { nome: 'M', preco: 20, limitedeComponente: 3 } }])
    expect(cenario.chamadas.limites[0]).toEqual({
      id: 2,
      limites: [
        { categoria: 'Carne', maximo: 2 },
        { categoria: 'Guarnicao', maximo: 0 },
      ],
    })
    expect(cenario.chamadas.ordemDosTamanhos).toEqual(['PUT /tamanhos/{id}', 'PUT /tamanhos/{id}/limites'])
    expect(await secaoDeTamanhos().findByText('Carne: até 2')).toBeInTheDocument()
    expect(secaoDeTamanhos().queryByText('Salada: não incluso')).not.toBeInTheDocument()
  })

  it('desmarcar todos os limites envia lista vazia (remove todos)', async () => {
    const cenario = await abrirTamanhos()
    await userEvent.click(secaoDeTamanhos().getByRole('button', { name: 'Editar Marmita M' }))
    const form = within(screen.getByRole('form', { name: 'Editar Marmita M' }))

    await userEvent.click(form.getByRole('checkbox', { name: 'Limitar Carne' }))
    await userEvent.click(form.getByRole('checkbox', { name: 'Limitar Salada' }))
    await userEvent.click(form.getByRole('button', { name: 'Salvar tamanho' }))

    await waitFor(() => expect(cenario.chamadas.limites).toEqual([{ id: 2, limites: [] }]))
  })

  it('409 em nome duplicado aparece abaixo do campo Nome', async () => {
    const cenario = await abrirTamanhos()
    cenario.recusarTamanho = { status: 409, detail: 'Já existe um tamanho com o nome G.' }
    await userEvent.click(secaoDeTamanhos().getByRole('button', { name: 'Editar Marmita M' }))
    const form = within(screen.getByRole('form', { name: 'Editar Marmita M' }))

    await userEvent.clear(form.getByLabelText('Nome'))
    await userEvent.type(form.getByLabelText('Nome'), 'G')
    await userEvent.click(form.getByRole('button', { name: 'Salvar tamanho' }))

    expect(await form.findByText('Já existe um tamanho com o nome G.')).toBeInTheDocument()
    expect(cenario.chamadas.limites).toEqual([]) // a segunda chamada nao acontece se a primeira falhou
  })

  it('400 em valor invalido aparece num Banner', async () => {
    const cenario = await abrirTamanhos()
    cenario.recusarTamanho = { status: 400, detail: 'O limite de componentes não pode ser negativo.' }
    await userEvent.click(secaoDeTamanhos().getByRole('button', { name: 'Editar Marmita M' }))
    const form = within(screen.getByRole('form', { name: 'Editar Marmita M' }))

    await userEvent.click(form.getByRole('button', { name: 'Salvar tamanho' }))

    expect(await form.findByRole('alert')).toHaveTextContent('O limite de componentes não pode ser negativo.')
  })
})
