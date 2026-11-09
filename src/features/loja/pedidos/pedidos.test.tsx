import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Permissao } from '../../../api/tipos'
import { formatBRL } from '../../../lib/formatar'
import { criarUsuario, guardarSessao, renderizarLoja, responderEu } from '../../../test/loja'
import { definirDesktop, removerMatchMedia } from '../../../test/matchMedia'
import { RESUMO_ENVIADO, RESUMO_NAO_ENVIADO, servirLoja } from '../../../test/pedidos'

afterEach(() => removerMatchMedia())

const brl = (valor: number) => formatBRL(valor).replace(/\s/g, ' ')

async function abrirPedidos(permissoes: Permissao[] = ['VerPedidos'], desktop = true) {
  definirDesktop(desktop)
  guardarSessao()
  responderEu(() => criarUsuario({ permissoes }))
  const retorno = renderizarLoja('/loja/pedidos')
  await screen.findByRole('heading', { name: 'Pedidos de hoje' })
  // a lista carrega depois do titulo: espera o esqueleto sair
  await waitFor(() => expect(screen.queryByLabelText('Carregando os pedidos')).not.toBeInTheDocument())
  return retorno
}

const atualizarPeloFoco = () =>
  act(() => {
    document.dispatchEvent(new Event('visibilitychange', { bubbles: true }))
  })

describe('aba Pedidos no computador', () => {
  it('tabela com colunas, itens do detalhe, entrega, pagamento, troco, referencia e observacao', async () => {
    servirLoja()
    await abrirPedidos()

    const colunas = screen.getAllByRole('columnheader').map((c) => c.textContent)
    expect(colunas).toEqual(['Pedido', 'Cliente', 'Itens', 'Total', 'Status'])
    expect(screen.getByText('O mais recente aparece primeiro')).toBeInTheDocument()

    const linha = within(screen.getByRole('row', { name: /Nº 14/ }))
    expect(linha.getByText('Nº 14')).toBeInTheDocument()
    expect(linha.getByText('20:00')).toBeInTheDocument() // 23:00 UTC = 20:00 em Brasilia
    expect(linha.getByText('Maria')).toBeInTheDocument()
    expect(linha.getByText('(31) 98888-7777')).toBeInTheDocument()
    expect(await linha.findByText('2x Marmita M (Arroz, Feijão), 1x Bebida 1')).toBeInTheDocument()
    expect(await linha.findByText(`Entrega, Rua A, 10 · Dinheiro, troco para ${brl(100)}`)).toBeInTheDocument()
    expect(linha.getByText('Ref.: portão azul')).toBeInTheDocument()
    expect(linha.getByText('Obs.: sem cebola')).toBeInTheDocument()
    expect(linha.getByText(brl(65))).toBeInTheDocument()
  })

  it('"Gerado" vira "Não enviado" com o botao de chamar; "Enviado" fica sem botao', async () => {
    servirLoja()
    await abrirPedidos()

    const naoEnviado = within(screen.getByRole('row', { name: /Nº 14/ }))
    expect(naoEnviado.getByText('Não enviado')).toBeInTheDocument()
    const chamar = naoEnviado.getByRole('link', { name: /Chamar Maria no WhatsApp/ })
    expect(chamar).toHaveAttribute('href', `https://wa.me/5531988887777?text=${encodeURIComponent('Olá, Maria! Aqui é do KF Restaurante, sobre o seu pedido nº 14.')}`)
    expect(chamar).toHaveAttribute('target', '_blank')
    expect(chamar).toHaveAttribute('rel', 'noopener noreferrer')
    expect(chamar).toHaveTextContent('Chamar no WhatsApp')
    expect(screen.getByRole('row', { name: /Nº 14/ }).className).toContain('bg-warn-row')

    const enviado = within(screen.getByRole('row', { name: /Nº 13/ }))
    expect(enviado.getByText('Enviado')).toBeInTheDocument()
    expect(enviado.queryByRole('link')).not.toBeInTheDocument()
  })

  it('contadores vem da lista completa e o filtro e aplicado no cliente', async () => {
    const cenario = servirLoja()
    await abrirPedidos()
    const contador = (nome: string) => screen.getByRole('button', { name: new RegExp(nome) })

    expect(contador('Todos')).toHaveTextContent('2')
    expect(contador('Enviados')).toHaveTextContent('1')
    expect(contador('Não enviados')).toHaveTextContent('1')

    await userEvent.click(contador('Não enviados'))

    expect(contador('Não enviados')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('row', { name: /Nº 14/ })).toBeInTheDocument()
    expect(screen.queryByRole('row', { name: /Nº 13/ })).not.toBeInTheDocument()
    expect(contador('Todos')).toHaveTextContent('2') // contagem nao muda com o filtro
    expect(cenario.chamadas.lista).toBe(1) // filtrar nao chama a API
  })

  it('filtro sem resultado e dia sem pedidos tem mensagens proprias', async () => {
    servirLoja({ lista: [RESUMO_ENVIADO] })
    await abrirPedidos()

    await userEvent.click(screen.getByRole('button', { name: /Não enviados/ }))
    expect(screen.getByText('Nenhum pedido nesse filtro.')).toBeInTheDocument()
  })

  it('sem pedidos hoje: "Nenhum pedido ainda hoje."', async () => {
    servirLoja({ lista: [] })
    await abrirPedidos()

    expect(screen.getByText('Nenhum pedido ainda hoje.')).toBeInTheDocument()
  })

  it('o detalhe de cada pedido e buscado uma vez; o polling da lista nao o refaz', async () => {
    const cenario = servirLoja()
    await abrirPedidos()
    await screen.findByText('2x Marmita M (Arroz, Feijão), 1x Bebida 1')
    expect(cenario.chamadas.detalhes).toEqual({ 1: 1, 2: 1 })

    atualizarPeloFoco()
    await waitFor(() => expect(cenario.chamadas.lista).toBeGreaterThan(1))

    expect(cenario.chamadas.detalhes).toEqual({ 1: 1, 2: 1 })
  })

  it('pedido novo no polling entra no topo e e anunciado para leitor de tela; a primeira carga nao anuncia nada', async () => {
    const cenario = servirLoja()
    await abrirPedidos()
    // o anuncio de pedidos novos fica dentro do painel da aba (o do layout e outro, para mudanca de aba)
    const anuncio = within(screen.getByRole('tabpanel')).getAllByRole('status').find((no) => no.className.includes('so-leitor'))
    expect(anuncio).toHaveTextContent('')

    cenario.lista = [{ ...RESUMO_ENVIADO, id: 3, numero: 15, horaPedido: '2026-11-09T00:30:00Z', nomeCliente: 'Ana' }, ...cenario.lista]
    atualizarPeloFoco()

    await waitFor(() => expect(anuncio).toHaveTextContent('Novo pedido nº 15'))
    expect(anuncio).toHaveAttribute('aria-live', 'polite')
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Nº 15') // mais recente no topo
  })

  it('falha ao carregar: mensagem com "Tentar de novo"', async () => {
    servirLoja()
    definirDesktop(true)
    guardarSessao()
    responderEu(() => criarUsuario({ permissoes: ['VerPedidos'] }))
    const { http, HttpResponse } = await import('msw')
    const { servidor } = await import('../../../test/servidor')
    servidor.use(http.get('http://localhost:5000/pedidos', () => new HttpResponse(null, { status: 500 })))
    renderizarLoja('/loja/pedidos')

    expect(await screen.findByText('Não foi possível carregar')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument()
  })
})

describe('coluna "Acabou alguma coisa?" (EsgotarOpcoes)', () => {
  it('aparece com a permissao e some sem ela, deixando a tabela com a largura toda', async () => {
    servirLoja()
    const { unmount } = await abrirPedidos(['VerPedidos', 'EsgotarOpcoes'])
    expect(await screen.findByText('Acabou alguma coisa?')).toBeInTheDocument()
    expect(screen.getByText('Um toque e o cliente vê na hora.')).toBeInTheDocument()
    unmount()

    await abrirPedidos(['VerPedidos'])
    expect(screen.queryByText('Acabou alguma coisa?')).not.toBeInTheDocument()
  })

  it('lista as opcoes do cardapio de hoje; marcar chama PATCH, reflete na hora e fica', async () => {
    const cenario = servirLoja()
    await abrirPedidos(['VerPedidos', 'EsgotarOpcoes'])

    const toggle = await screen.findByRole('button', { name: 'Carne 1: disponível' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Guarnição 1: esgotado' })).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(toggle)

    expect(await screen.findByRole('button', { name: 'Carne 1: esgotado' })).toHaveAttribute('aria-pressed', 'true')
    await waitFor(() => expect(cenario.chamadas.esgotados).toEqual([{ id: 1, esgotado: true }]))
    expect(screen.getByRole('button', { name: 'Carne 1: esgotado' })).toBeInTheDocument() // continua depois de reconsultar
  })

  it('se a API recusar, a mudanca volta e o banner mostra a mensagem', async () => {
    servirLoja({ recusarEsgotado: { status: 400, detail: 'Não foi possível alterar a opção.' } })
    await abrirPedidos(['VerPedidos', 'EsgotarOpcoes'])

    await userEvent.click(await screen.findByRole('button', { name: 'Carne 1: disponível' }))

    expect(await screen.findByText('Não foi possível alterar a opção.')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Carne 1: disponível' })).toHaveAttribute('aria-pressed', 'false'))
  })

  it('sem cardapio publicado hoje: "Sem cardapio publicado hoje." e, com GerenciarCardapio, o link', async () => {
    servirLoja({ cardapio: null })
    await abrirPedidos(['VerPedidos', 'EsgotarOpcoes', 'GerenciarCardapio'])

    expect(await screen.findByText('Sem cardápio publicado hoje.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir para o cardápio' })).toHaveAttribute('href', '/loja/cardapio')
  })
})

describe('aba Pedidos no celular', () => {
  it('um cartao por pedido, filtros com rotulo curto e sem a coluna de esgotados', async () => {
    servirLoja()
    await abrirPedidos(['VerPedidos', 'EsgotarOpcoes'], false)

    expect(screen.getByRole('button', { name: /Não env\./ })).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByText('Acabou alguma coisa?')).not.toBeInTheDocument()

    const cartao = within(screen.getByText('Nº 14').closest('li') as HTMLElement)
    expect(cartao.getByText('Não enviado')).toBeInTheDocument()
    expect(await cartao.findByText('2x Marmita M (Arroz, Feijão), 1x Bebida 1')).toBeInTheDocument()
    expect(await cartao.findByText(`Entrega, Rua A, 10 · Dinheiro, troco para ${brl(100)}`)).toBeInTheDocument()
    expect(cartao.getByText(brl(65))).toBeInTheDocument()
    expect(cartao.getByRole('link', { name: /Chamar Maria no WhatsApp/ })).toBeInTheDocument()

    const enviado = within(screen.getByText('Nº 13').closest('li') as HTMLElement)
    expect(enviado.queryByRole('link')).not.toBeInTheDocument()
  })
})

describe('cabecalho da loja: selo de aberta e fechada', () => {
  async function abrirComo(permissoes: Permissao[]) {
    definirDesktop(true)
    guardarSessao()
    responderEu(() => criarUsuario({ permissoes }))
    renderizarLoja('/loja/pedidos')
    await screen.findByRole('heading', { name: 'Pedidos de hoje' })
  }

  it('sem AbrirFecharLoja o selo aparece, mas NAO e botao', async () => {
    servirLoja()
    await abrirComo(['VerPedidos'])

    expect(await screen.findByText('Loja aberta')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Loja aberta/ })).not.toBeInTheDocument()
  })

  it('com AbrirFecharLoja e botao: fechar chama a API e o selo muda', async () => {
    const cenario = servirLoja()
    await abrirComo(['VerPedidos', 'AbrirFecharLoja'])

    await userEvent.click(await screen.findByRole('button', { name: 'Loja aberta. Clicar para fechar' }))

    expect(await screen.findByRole('button', { name: 'Loja fechada. Clicar para abrir' })).toBeInTheDocument()
    expect(cenario.chamadas.restaurante).toEqual(['fechar'])
  })

  it('abrir sem WhatsApp: a mensagem da API aparece no banner e a loja continua fechada', async () => {
    servirLoja({ restaurante: { aberto: false, whatsApp: null }, recusarAbrir: { status: 400, detail: 'Cadastre o WhatsApp da loja antes de abrir.' } })
    await abrirComo(['VerPedidos', 'AbrirFecharLoja'])

    await userEvent.click(await screen.findByRole('button', { name: 'Loja fechada. Clicar para abrir' }))

    expect(await screen.findByText('Cadastre o WhatsApp da loja antes de abrir.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Loja fechada. Clicar para abrir' })).toBeInTheDocument()
  })
})

describe('contratos de dados usados nesta tela', () => {
  it('os resumos de teste batem com o contrato (sem itens, endereco, referencia, observacao nem troco)', () => {
    expect(Object.keys(RESUMO_NAO_ENVIADO).sort()).toEqual(
      ['formaDePagamento', 'horaPedido', 'id', 'nomeCliente', 'numero', 'status', 'telefone', 'tipoDeEntrega', 'total'].sort(),
    )
  })
})
