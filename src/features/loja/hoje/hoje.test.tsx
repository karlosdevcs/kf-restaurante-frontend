import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Permissao } from '../../../api/tipos'
import { criarUsuario, guardarSessao, renderizarLoja, responderEu } from '../../../test/loja'
import { definirDesktop, removerMatchMedia } from '../../../test/matchMedia'
import { servirLoja } from '../../../test/pedidos'

afterEach(() => removerMatchMedia())

async function abrirHoje(permissoes: Permissao[], desktop = true) {
  definirDesktop(desktop)
  guardarSessao()
  responderEu(() => criarUsuario({ permissoes }))
  const retorno = renderizarLoja('/loja/hoje')
  await screen.findByRole('heading', { name: 'Hoje' })
  return retorno
}

const TODAS: Permissao[] = ['AbrirFecharLoja', 'AlterarWhatsApp', 'EsgotarOpcoes']

describe('blocos da aba Hoje por permissao', () => {
  it.each([
    [['AbrirFecharLoja'], { status: true, whatsapp: false, acabou: false }],
    [['AlterarWhatsApp'], { status: false, whatsapp: true, acabou: false }],
    [['EsgotarOpcoes'], { status: false, whatsapp: false, acabou: true }],
    [TODAS, { status: true, whatsapp: true, acabou: true }],
  ] as const)('com %j mostra so os blocos certos', async (permissoes, esperado) => {
    servirLoja()
    await abrirHoje([...permissoes])
    await screen.findByRole('heading', { name: 'Hoje' })

    const aparece = (nome: string) => screen.queryByRole('region', { name: nome }) !== null
    await waitFor(() => expect(aparece('Acabou alguma coisa?')).toBe(esperado.acabou))
    expect(aparece('Estado da loja')).toBe(esperado.status)
    expect(aparece('WhatsApp da loja')).toBe(esperado.whatsapp)
  })

  it('layout do celular: os mesmos blocos, em lista', async () => {
    servirLoja()
    await abrirHoje(TODAS, false)

    expect(await screen.findByRole('region', { name: 'Estado da loja' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'WhatsApp da loja' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Carne 1: disponível' })).toBeInTheDocument()
  })
})

describe('cartao de status da loja', () => {
  it('mostra o estado e o botao muda a loja nas duas direcoes', async () => {
    const cenario = servirLoja()
    await abrirHoje(['AbrirFecharLoja'])
    const cartao = within(await screen.findByRole('region', { name: 'Estado da loja' }))

    expect(cartao.getByRole('heading', { name: 'Loja aberta' })).toBeInTheDocument()
    expect(cartao.getByText('Clientes conseguem pedir agora.')).toBeInTheDocument()

    await userEvent.click(cartao.getByRole('button', { name: 'Fechar a loja' }))

    expect(await cartao.findByRole('heading', { name: 'Loja fechada' })).toBeInTheDocument()
    expect(cartao.getByText('Clientes veem o cardápio, mas não conseguem pedir.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Loja fechada. Clicar para abrir' })).toBeInTheDocument() // o selo do cabecalho acompanha

    await userEvent.click(cartao.getByRole('button', { name: 'Abrir a loja' }))
    expect(await cartao.findByRole('heading', { name: 'Loja aberta' })).toBeInTheDocument()
    expect(cenario.chamadas.restaurante).toEqual(['fechar', 'abrir'])
  })

  it('abrir sem WhatsApp: mostra a mensagem da API e, com AlterarWhatsApp, foca no campo', async () => {
    servirLoja({ restaurante: { aberto: false, whatsApp: null }, recusarAbrir: { status: 400, detail: 'Cadastre o WhatsApp da loja antes de abrir.' } })
    await abrirHoje(['AbrirFecharLoja', 'AlterarWhatsApp'])

    await userEvent.click(await screen.findByRole('button', { name: 'Abrir a loja' }))

    expect(await screen.findByText('Cadastre o WhatsApp da loja antes de abrir.')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByLabelText('Novo número')).toHaveFocus())
  })

  it('abrir sem WhatsApp e sem AlterarWhatsApp: so a mensagem, sem campo', async () => {
    servirLoja({ restaurante: { aberto: false, whatsApp: null }, recusarAbrir: { status: 400, detail: 'Cadastre o WhatsApp da loja antes de abrir.' } })
    await abrirHoje(['AbrirFecharLoja'])

    await userEvent.click(await screen.findByRole('button', { name: 'Abrir a loja' }))

    expect(await screen.findByText('Cadastre o WhatsApp da loja antes de abrir.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Novo número')).not.toBeInTheDocument()
  })
})

describe('cartao do WhatsApp da loja', () => {
  it('mostra o numero atual formatado', async () => {
    servirLoja()
    await abrirHoje(['AlterarWhatsApp'])

    expect(await screen.findByText('+55 (31) 99999-9999')).toBeInTheDocument()
  })

  it('sem numero: "Não cadastrado" e o aviso de que a loja so abre com o WhatsApp', async () => {
    servirLoja({ restaurante: { aberto: false, whatsApp: null } })
    await abrirHoje(['AlterarWhatsApp'])

    expect(await screen.findByText('Não cadastrado')).toBeInTheDocument()
    expect(screen.getByText('A loja só abre com o WhatsApp cadastrado.')).toBeInTheDocument()
  })

  it('salvar envia o numero como digitado, atualiza o cartao e limpa o campo', async () => {
    const cenario = servirLoja({ restaurante: { aberto: false, whatsApp: null } })
    await abrirHoje(['AlterarWhatsApp'])

    await userEvent.type(await screen.findByLabelText('Novo número'), '+55 (31) 98888-7777')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('+55 (31) 98888-7777')).toBeInTheDocument()
    expect(cenario.chamadas.whatsapp).toEqual(['+55 (31) 98888-7777'])
    expect(screen.getByLabelText('Novo número')).toHaveValue('')
    expect(screen.getByText('WhatsApp atualizado.')).toBeInTheDocument()
    expect(screen.queryByText('Não cadastrado')).not.toBeInTheDocument()
  })

  it('o erro 400 da API (formato) aparece junto do campo', async () => {
    servirLoja({ recusarWhatsApp: { status: 400, detail: 'O WhatsApp deve ter 12 ou 13 dígitos, incluindo o 55.' } })
    await abrirHoje(['AlterarWhatsApp'])

    await userEvent.type(await screen.findByLabelText('Novo número'), '123')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    const campo = await screen.findByLabelText('Novo número')
    expect(await screen.findByText('O WhatsApp deve ter 12 ou 13 dígitos, incluindo o 55.')).toBeInTheDocument()
    expect(campo).toHaveAttribute('aria-invalid', 'true')
  })

  it('campo vazio nao chama a API', async () => {
    const cenario = servirLoja()
    await abrirHoje(['AlterarWhatsApp'])

    await userEvent.click(await screen.findByRole('button', { name: 'Salvar' }))

    expect(screen.getByText('Informe o número do WhatsApp.')).toBeInTheDocument()
    expect(cenario.chamadas.whatsapp).toEqual([])
  })
})

describe('"Acabou alguma coisa?" na aba Hoje', () => {
  it('marcar esgotado reflete na hora e chama o PATCH', async () => {
    const cenario = servirLoja()
    await abrirHoje(['EsgotarOpcoes'])

    await userEvent.click(await screen.findByRole('button', { name: 'Acompanhamento 1: disponível' }))

    expect(await screen.findByRole('button', { name: 'Acompanhamento 1: esgotado' })).toBeInTheDocument()
    await waitFor(() => expect(cenario.chamadas.esgotados).toEqual([{ id: 3, esgotado: true }]))
  })

  it('sem cardapio publicado hoje', async () => {
    servirLoja({ cardapio: null })
    await abrirHoje(['EsgotarOpcoes'])

    expect(await screen.findByText('Sem cardápio publicado hoje.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Ir para o cardápio' })).not.toBeInTheDocument() // falta GerenciarCardapio
  })
})
