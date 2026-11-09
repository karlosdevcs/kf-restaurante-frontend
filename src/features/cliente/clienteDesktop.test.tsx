import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { formatBRL } from '../../lib/formatar'
import { definirDesktop, removerMatchMedia } from '../../test/matchMedia'
import { MENSAGEM_DO_PEDIDO, servirCliente } from '../../test/cliente'
import { renderizarApp } from '../../test/loja'

beforeEach(() => definirDesktop(true))
afterEach(() => removerMatchMedia())

const brl = (valor: number) => formatBRL(valor).replace(/\s/g, ' ')
const caminhoAtual = (roteador: { state: { location: { pathname: string; search: string } } }) => roteador.state.location.pathname + roteador.state.location.search

async function abrir(caminho = '/') {
  const retorno = renderizarApp(caminho)
  await screen.findByRole('heading', { level: 1, name: /^Marmita / })
  return retorno
}

const carrinho = () => within(screen.getByRole('complementary', { name: 'Meu pedido' }))

async function preencherDados() {
  await userEvent.type(screen.getByLabelText('Nome'), 'Maria')
  await userEvent.type(screen.getByLabelText('WhatsApp'), '(31) 98888-7777')
}

describe('pagina unica do computador', () => {
  it('abre com o tamanho do meio, sem modo "montar" separado, e o carrinho lateral com o formulario', async () => {
    servirCliente()
    await abrir()

    expect(screen.getByRole('heading', { level: 1, name: 'Marmita M' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'M' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('MONTE SUA MARMITA · 0/3')).toBeInTheDocument()
    expect(screen.getByText('Marmita montada na hora, com os ingredientes que você escolher abaixo.')).toBeInTheDocument()

    expect(carrinho().getByText('Seu pedido vai aparecer aqui.')).toBeInTheDocument()
    expect(carrinho().getByText('0 itens')).toBeInTheDocument()
    for (const campo of ['Nome', 'WhatsApp', 'Observação']) expect(carrinho().getByLabelText(campo)).toBeInTheDocument()
    expect(carrinho().getByRole('button', { name: 'Confirmar pedido' })).toBeDisabled()
    expect(carrinho().getByText('O pedido chega no WhatsApp da loja.')).toBeInTheDocument()
    expect(screen.queryByText(/taxa/i)).not.toBeInTheDocument() // o backend nao cobra entrega: nao existe linha de taxa
  })

  it('?tamanho= mantem o tamanho; /montar/:id vira /?tamanho=:id; /pedido volta para /', async () => {
    servirCliente()
    const { roteador, unmount } = renderizarApp('/montar/3')

    expect(await screen.findByRole('heading', { level: 1, name: 'Marmita G' })).toBeInTheDocument()
    expect(caminhoAtual(roteador)).toBe('/?tamanho=3')
    unmount()

    const outro = renderizarApp('/pedido')
    await screen.findByRole('heading', { level: 1, name: 'Marmita M' })
    expect(caminhoAtual(outro.roteador)).toBe('/')
  })

  it('o filtro de categoria filtra os ingredientes mostrados', async () => {
    servirCliente()
    await abrir()

    await userEvent.click(screen.getByRole('button', { name: 'Salada' }))

    expect(screen.getByRole('button', { name: 'Salada 1' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Carne 1' })).not.toBeInTheDocument()
  })

  it('"Pra acompanhar" so tem o que tem preco', async () => {
    servirCliente()
    await abrir()

    const secao = within(screen.getByRole('region', { name: 'Pra acompanhar' }))
    expect(secao.getByText('Bebida 1')).toBeInTheDocument()
    expect(secao.getByText('Esgotado')).toBeInTheDocument()
    expect(secao.queryByText('Carne 1')).not.toBeInTheDocument()
  })

  it('limites da marmita valem aqui tambem: contador e bloqueio por categoria e total', async () => {
    servirCliente()
    await abrir()

    await userEvent.click(screen.getByRole('button', { name: 'Carne 1' }))
    expect(screen.getByText('MONTE SUA MARMITA · 1/3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Carne 2' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Salada 1' })).toBeDisabled() // M: salada nao incluida
    expect(screen.getByRole('button', { name: 'Guarnição 1 (acabou)' })).toBeDisabled()
  })

  it('trocar de tamanho mantem a selecao e corta o excedente', async () => {
    servirCliente()
    const { roteador } = await abrir('/?tamanho=3')
    await userEvent.click(screen.getByRole('button', { name: 'Carne 1' }))
    await userEvent.click(screen.getByRole('button', { name: 'Carne 2' }))
    await userEvent.click(screen.getByRole('button', { name: 'Acompanhamento 1' }))
    expect(screen.getByText('MONTE SUA MARMITA · 3/4')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'P' })) // P: total 2, Carne ate 1

    expect(caminhoAtual(roteador)).toBe('/?tamanho=1')
    expect(screen.getByText('MONTE SUA MARMITA · 2/2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Carne 2' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('"Adicionar" fica desabilitado sem ingrediente e mostra o preco; o stepper multiplica', async () => {
    servirCliente()
    await abrir()
    const adicionar = () => screen.getByRole('button', { name: /Adicionar$/ })

    expect(adicionar()).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Carne 1' }))
    expect(adicionar()).toBeEnabled()
    expect(adicionar()).toHaveTextContent(brl(20))

    await userEvent.click(screen.getByRole('button', { name: 'Aumentar quantidade' }))
    expect(adicionar()).toHaveTextContent(brl(40))
  })

  it('fluxo completo: monta a marmita, adiciona um avulso, preenche o formulario no carrinho e confirma', async () => {
    const cenario = servirCliente()
    const { roteador } = await abrir()

    await userEvent.click(screen.getByRole('button', { name: 'Carne 1' }))
    await userEvent.click(screen.getByRole('button', { name: 'Acompanhamento 1' }))
    await userEvent.click(screen.getByRole('button', { name: 'Aumentar quantidade' }))
    await userEvent.click(screen.getByRole('button', { name: /Adicionar$/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar Bebida 1' }))

    expect(carrinho().getByText('2x Marmita M')).toBeInTheDocument()
    expect(carrinho().getByText('Carne 1, Acompanhamento 1')).toBeInTheDocument()
    expect(carrinho().getByText('1x Bebida 1')).toBeInTheDocument()
    expect(carrinho().getByText('3 itens')).toBeInTheDocument()
    expect(carrinho().getByText(brl(46))).toBeInTheDocument() // total: 2 x 20 + 6
    expect(screen.getByText('MONTE SUA MARMITA · 0/3')).toBeInTheDocument() // a selecao foi limpa

    expect(carrinho().getByText('Preencha seu nome pra finalizar')).toBeInTheDocument()
    await preencherDados()
    await userEvent.click(carrinho().getByRole('button', { name: 'Confirmar pedido' }))

    expect(await screen.findByRole('heading', { name: 'Pedido nº 14 registrado' })).toBeInTheDocument()
    expect(caminhoAtual(roteador)).toBe('/confirmacao/14')
    expect(cenario.chamadas.pedidos[0]?.itens).toEqual([
      { tamanhoId: 2, componentesIds: [1, 3], quantidade: 2 },
      { opcaoId: 7, quantidade: 1 },
    ])
  })

  it('o stepper de linha do carrinho muda a quantidade e remove ao chegar a 0', async () => {
    servirCliente()
    await abrir()
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar Bebida 1' }))

    await userEvent.click(carrinho().getByRole('button', { name: 'Aumentar quantidade de Bebida 1' }))
    expect(carrinho().getByText('2x Bebida 1')).toBeInTheDocument()

    await userEvent.click(carrinho().getByRole('button', { name: 'Diminuir quantidade de Bebida 1' }))
    await userEvent.click(carrinho().getByRole('button', { name: 'Diminuir quantidade de Bebida 1' }))
    expect(carrinho().getByText('Seu pedido vai aparecer aqui.')).toBeInTheDocument()
  })

  it('erro 400 aparece no carrinho e nada e perdido', async () => {
    const cenario = servirCliente()
    await abrir()
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar Bebida 1' }))
    await preencherDados()
    cenario.respostaDoPedido = { status: 400, detail: 'O restaurante está fechado.' }

    await userEvent.click(carrinho().getByRole('button', { name: 'Confirmar pedido' }))

    expect(await carrinho().findByText('O restaurante está fechado.')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome')).toHaveValue('Maria')
    expect(carrinho().getByText('1x Bebida 1')).toBeInTheDocument()
  })

  it('loja fechada: faixa, selo e nada de adicionar nem confirmar', async () => {
    servirCliente({ restaurante: { aberto: false, whatsApp: '5531999999999' } })
    await abrir()

    expect(screen.getByText('Fechado')).toBeInTheDocument()
    expect(screen.getByText('A loja está fechada. Você pode ver o cardápio, mas não consegue pedir agora.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Adicionar Bebida 1' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Carne 1' })).toBeDisabled()
    expect(carrinho().getByRole('button', { name: 'Confirmar pedido' })).toBeDisabled()
  })

  it('sem cardapio hoje: so o aviso, sem carrinho', async () => {
    servirCliente({ cardapio: null })
    renderizarApp('/')

    expect(await screen.findByText('A loja ainda não publicou o cardápio de hoje')).toBeInTheDocument()
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  })

  it('a confirmacao no computador ocupa a pagina, centralizada, com os botoes no corpo', async () => {
    servirCliente()
    await abrir()
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar Bebida 1' }))
    await preencherDados()
    await userEvent.click(carrinho().getByRole('button', { name: 'Confirmar pedido' }))
    await screen.findByRole('heading', { name: 'Pedido nº 14 registrado' })

    const corpo = within(screen.getByRole('main'))
    expect(corpo.getByRole('link', { name: 'Enviar no WhatsApp' })).toHaveAttribute('href', 'https://wa.me/5531999999999?text=Pedido')
    expect(corpo.getByText(MENSAGEM_DO_PEDIDO, { normalizer: (texto) => texto })).toBeInTheDocument()
    expect(screen.getByRole('main').className).toContain('max-w-[680px]')
    expect(document.querySelector('footer')).toBeNull()

    await userEvent.click(corpo.getByRole('button', { name: 'Fazer outro pedido' }))
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: /^Marmita / })).toBeInTheDocument())
    expect(carrinho().getByText('Seu pedido vai aparecer aqui.')).toBeInTheDocument()
  })
})
