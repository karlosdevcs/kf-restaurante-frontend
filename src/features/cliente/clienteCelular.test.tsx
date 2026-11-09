import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { formatBRL } from '../../lib/formatar'
import { removerMatchMedia } from '../../test/matchMedia'
import { MENSAGEM_DO_PEDIDO, OPCOES, pedidoDeResposta, servirCliente } from '../../test/cliente'
import { renderizarApp } from '../../test/loja'
import { servidor } from '../../test/servidor'

// celular: sem matchMedia o hook useIsDesktop assume celular
beforeEach(() => removerMatchMedia())

// formatBRL usa espaco inseparavel; o texto lido do DOM vem com espaco comum
const brl = (valor: number) => formatBRL(valor).replace(/\s/g, ' ')

const caminhoAtual = (roteador: { state: { location: { pathname: string } } }) => roteador.state.location.pathname

async function abrirCardapio() {
  const retorno = renderizarApp('/')
  await screen.findByRole('heading', { name: 'Monte sua marmita' })
  return retorno
}

function secao(nome: string) {
  return within(screen.getByRole('region', { name: nome }))
}

async function preencherDados(nome = 'Maria', whatsApp = '(31) 98888-7777') {
  await userEvent.type(screen.getByLabelText('Nome'), nome)
  await userEvent.type(screen.getByLabelText('WhatsApp'), whatsApp)
}

describe('cardapio (tela 1)', () => {
  it('mostra tamanhos, "Hoje tem" so com componentes e "Pra acompanhar" so com o que tem preco', async () => {
    servirCliente()
    await abrirCardapio()

    const tamanhos = screen.getAllByRole('link').map((link) => link.getAttribute('href'))
    expect(tamanhos).toEqual(['/montar/1', '/montar/2', '/montar/3'])

    const hoje = secao('Hoje tem')
    for (const nome of ['Carne 1', 'Carne 2', 'Acompanhamento 1', 'Salada 1', 'Prato 1']) expect(hoje.getByText(nome)).toBeInTheDocument()
    expect(hoje.queryByText('Bebida 1')).not.toBeInTheDocument() // Bebida e Sobremesa nao sao componentes
    expect(hoje.queryByText('Sobremesa 1')).not.toBeInTheDocument()
    expect(hoje.getByText('acabou')).toBeInTheDocument() // Guarnicao 1 esgotada continua visivel

    const acompanhar = secao('Pra acompanhar')
    expect(acompanhar.getByText('Bebida 1')).toBeInTheDocument()
    expect(acompanhar.getByText('Prato 1')).toBeInTheDocument() // componente com preco aparece nos dois lugares
    expect(acompanhar.queryByText('Carne 1')).not.toBeInTheDocument() // sem preco nunca e avulso
    expect(acompanhar.getByText('Esgotado')).toBeInTheDocument()
    expect(acompanhar.getByRole('button', { name: 'Adicionar Sobremesa 1' })).toBeDisabled()
  })

  it('o filtro de categoria filtra so a lista "Hoje tem"', async () => {
    servirCliente()
    await abrirCardapio()

    await userEvent.click(screen.getByRole('button', { name: 'Salada' }))

    const hoje = secao('Hoje tem')
    expect(hoje.getByText('Salada 1')).toBeInTheDocument()
    expect(hoje.queryByText('Carne 1')).not.toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(3) // tamanhos intactos
    expect(secao('Pra acompanhar').getByText('Bebida 1')).toBeInTheDocument() // avulsos intactos
  })

  it('carrinho vazio: "Montar minha marmita" vai ao tamanho do meio', async () => {
    servirCliente()
    const { roteador } = await abrirCardapio()

    await userEvent.click(screen.getByRole('button', { name: 'Montar minha marmita' }))

    expect(caminhoAtual(roteador)).toBe('/montar/2')
  })

  it('adicionar avulso mostra "Nx" na linha e troca o rodape por "Ver pedido"', async () => {
    servirCliente()
    await abrirCardapio()

    await userEvent.click(screen.getByRole('button', { name: 'Adicionar Bebida 1' }))
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar Bebida 1' }))

    expect(screen.getByText('2x')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Montar minha marmita' })).not.toBeInTheDocument()
    const ver = screen.getByRole('button', { name: /Ver pedido/ })
    expect(ver).toHaveTextContent('2 itens')
    expect(ver).toHaveTextContent(brl(12))
  })

  it('selo "Aberto" quando a loja esta aberta', async () => {
    servirCliente()
    await abrirCardapio()

    expect(screen.getByText('Aberto')).toBeInTheDocument()
  })

  it('loja fechada: selo, faixa e todos os botoes de pedir desabilitados', async () => {
    servirCliente({ restaurante: { aberto: false, whatsApp: '5531999999999' } })
    await abrirCardapio()

    expect(screen.getByText('Fechado')).toBeInTheDocument()
    expect(screen.getByText('A loja está fechada. Você pode ver o cardápio, mas não consegue pedir agora.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Montar minha marmita' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Adicionar Bebida 1' })).toBeDisabled()
    expect(screen.queryAllByRole('link')).toHaveLength(0) // tamanhos nao navegam
  })

  it('cardapio encerrado: faixa propria e nada de pedir', async () => {
    servirCliente({ cardapio: { id: 5, dataPublicacao: '2026-11-08', situacao: 'Fechado', opcoes: OPCOES } })
    await abrirCardapio()

    expect(screen.getByText('O cardápio de hoje foi encerrado. Você pode ver o que teve, mas não consegue pedir.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Montar minha marmita' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Adicionar Bebida 1' })).toBeDisabled()
  })

  it('sem cardapio hoje (404): cartao explicativo, sem botao de montar', async () => {
    servirCliente({ cardapio: null })
    renderizarApp('/')

    expect(await screen.findByText('A loja ainda não publicou o cardápio de hoje')).toBeInTheDocument()
    expect(screen.getByText('Volte em alguns minutos.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Montar minha marmita' })).not.toBeInTheDocument()
  })

  it('cardapio sem nenhum componente: mesma mensagem do estado sem cardapio', async () => {
    servirCliente({ cardapio: { id: 5, dataPublicacao: '2026-11-08', situacao: 'Publicado', opcoes: OPCOES.filter((o) => o.categoria === 'Bebida') } })
    renderizarApp('/')

    expect(await screen.findByText('A loja ainda não publicou o cardápio de hoje')).toBeInTheDocument()
  })

  it('falha de rede ou 500: "Não foi possível carregar" com "Tentar de novo", que funciona', async () => {
    const cenario = servirCliente({ falhar: true })
    renderizarApp('/')

    expect(await screen.findByText('Não foi possível carregar')).toBeInTheDocument()

    cenario.falhar = false
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))

    expect(await screen.findByRole('heading', { name: 'Monte sua marmita' })).toBeInTheDocument()
  })

  it('o cliente nunca consulta GET /opcoes (exige login) nem envia token', async () => {
    const cabecalhos: Array<string | null> = []
    servirCliente()
    servidor.use(
      http.get('http://localhost:5000/opcoes', () => {
        throw new Error('o cliente nao pode chamar /opcoes')
      }),
      http.get('http://localhost:5000/tamanhos', ({ request }) => {
        cabecalhos.push(request.headers.get('Authorization'))
        return HttpResponse.json([])
      }),
    )
    sessionStorage.setItem('kf:sessao', JSON.stringify({ token: 'segredo', expiraEm: new Date(Date.now() + 3_600_000).toISOString() }))
    renderizarApp('/')

    await waitFor(() => expect(cabecalhos.length).toBeGreaterThan(0))
    expect(cabecalhos.every((c) => c === null)).toBe(true)
  })
})

describe('montar marmita (tela 2)', () => {
  async function abrirMontar(id = 2) {
    servirCliente()
    const retorno = renderizarApp(`/montar/${id}`)
    await screen.findByRole('heading', { name: new RegExp(`Marmita ${['P', 'M', 'G'][id - 1]}`) })
    return retorno
  }

  it('um grupo por categoria de componente, com "ate N" e "nao incluso neste tamanho"', async () => {
    await abrirMontar(2)

    for (const grupo of ['Carne', 'Acompanhamento', 'Guarnição', 'Salada']) expect(screen.getByRole('region', { name: grupo })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Bebida' })).not.toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Carne' })).getByText('até 1')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Salada' })).getByText('não incluso neste tamanho')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salada 1' })).toBeDisabled()
  })

  it('contador n/limite, limite por categoria e limite total bloqueiam os tiles certos', async () => {
    await abrirMontar(2) // total 3, Carne ate 1

    expect(screen.getByText('0/3')).toBeInTheDocument()
    expect(screen.getByText('Escolha pelo menos um item')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Adicionar ao pedido/ })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Carne 1' }))
    expect(screen.getByText('1/3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Carne 1' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Carne 2' })).toBeDisabled() // categoria atingiu o limite
    expect(screen.getByRole('button', { name: 'Prato 1' })).toBeDisabled() // tambem e Carne
    expect(screen.getByRole('button', { name: 'Acompanhamento 1' })).toBeEnabled()
    expect(screen.queryByText('Escolha pelo menos um item')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Acompanhamento 1' }))
    await userEvent.click(screen.getByRole('button', { name: 'Acompanhamento 2' }))
    expect(screen.getByText('3/3')).toBeInTheDocument()
    // total atingido: so os marcados continuam livres (para desmarcar)
    expect(screen.getByRole('button', { name: 'Carne 2' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Acompanhamento 2' })).toBeEnabled()

    await userEvent.click(screen.getByRole('button', { name: 'Carne 1' })) // desmarcar libera
    expect(screen.getByText('2/3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Carne 2' })).toBeEnabled()
  })

  it('esgotado fica visivel e nao pode ser marcado', async () => {
    await abrirMontar(3)

    expect(screen.getByRole('button', { name: 'Guarnição 1 (acabou)' })).toBeDisabled()
  })

  it('trocar de tamanho mantem a selecao e corta o que nao cabe (limite por categoria, depois o total)', async () => {
    const { roteador } = await abrirMontar(3) // G: total 4, Carne ate 2

    await userEvent.click(screen.getByRole('button', { name: 'Carne 1' }))
    await userEvent.click(screen.getByRole('button', { name: 'Carne 2' }))
    await userEvent.click(screen.getByRole('button', { name: 'Acompanhamento 1' }))
    await userEvent.click(screen.getByRole('button', { name: 'Salada 1' }))
    expect(screen.getByText('4/4')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'M' })) // M: total 3, Carne ate 1, Salada 0

    expect(caminhoAtual(roteador)).toBe('/montar/2')
    // Carne 2 sai (categoria) e Salada 1 sai (nao incluso); ficam Carne 1 e Acompanhamento 1
    expect(screen.getByText('2/3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Carne 1' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Acompanhamento 1' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Carne 2' })).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(screen.getByRole('button', { name: 'P' })) // P: total 2, Carne ate 1
    expect(screen.getByText('2/2')).toBeInTheDocument()
  })

  it('adicionar cria uma linha de marmita, limpa a selecao e volta ao cardapio', async () => {
    const { roteador } = await abrirMontar(2)
    await userEvent.click(screen.getByRole('button', { name: 'Carne 1' }))
    await userEvent.click(screen.getByRole('button', { name: 'Acompanhamento 1' }))

    await userEvent.click(screen.getByRole('button', { name: /Adicionar ao pedido/ }))

    expect(caminhoAtual(roteador)).toBe('/')
    expect(await screen.findByRole('button', { name: /Ver pedido/ })).toHaveTextContent(brl(20))
  })

  it('tamanho que nao existe volta para o cardapio', async () => {
    servirCliente()
    const { roteador } = renderizarApp('/montar/999')

    await screen.findByRole('heading', { name: 'Monte sua marmita' })
    expect(caminhoAtual(roteador)).toBe('/')
  })
})

describe('meu pedido e confirmacao (telas 3 e 4)', () => {
  async function comUmPratoNoCarrinho() {
    const cenario = servirCliente()
    const retorno = await abrirCardapio().then(async (r) => {
      await userEvent.click(screen.getByRole('button', { name: 'Adicionar Prato 1' }))
      await userEvent.click(screen.getByRole('button', { name: /Ver pedido/ }))
      return r
    })
    await screen.findByRole('heading', { name: 'Meu pedido' })
    return { cenario, ...retorno }
  }

  it('mostra os itens, o total e a primeira pendencia; o botao so habilita sem pendencia', async () => {
    await comUmPratoNoCarrinho()

    expect(screen.getByText('1x Prato 1')).toBeInTheDocument()
    expect(screen.getByText('Preencha seu nome pra finalizar')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Finalizar pedido' })).toBeDisabled()

    await userEvent.type(screen.getByLabelText('Nome'), 'Maria')
    expect(screen.getByText('Preencha seu WhatsApp com DDD')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('WhatsApp'), '(31) 98888-7777')
    expect(screen.queryByText('Preencha seu WhatsApp com DDD')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Finalizar pedido' })).toBeEnabled()
  })

  it('entrega pede endereco; retirada some com os campos; dinheiro mostra o troco', async () => {
    await comUmPratoNoCarrinho()
    await preencherDados()

    await userEvent.click(screen.getByRole('button', { name: 'Entrega' }))
    expect(screen.getByText('Preencha o endereço de entrega')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Endereço'), 'Rua A, 10')
    expect(screen.getByLabelText('Ponto de referência')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Finalizar pedido' })).toBeEnabled()

    await userEvent.click(screen.getByRole('button', { name: 'Retirada' }))
    expect(screen.queryByLabelText('Endereço')).not.toBeInTheDocument()

    expect(screen.queryByLabelText('Troco para quanto?')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Dinheiro' }))
    await userEvent.type(screen.getByLabelText('Troco para quanto?'), '10')
    expect(screen.getByText(`O troco precisa ser maior ou igual ao total (${brl(25)}).`)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Finalizar pedido' })).toBeDisabled()
  })

  it('o stepper de linha muda a quantidade e chegar a 0 remove o item', async () => {
    await comUmPratoNoCarrinho()

    await userEvent.click(screen.getByRole('button', { name: 'Aumentar quantidade de Prato 1' }))
    expect(screen.getByText('2x Prato 1')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Diminuir quantidade de Prato 1' }))
    await userEvent.click(screen.getByRole('button', { name: 'Diminuir quantidade de Prato 1' }))
    expect(screen.queryByText(/Prato 1/)).not.toBeInTheDocument()
    expect(screen.getByText('Adicione pelo menos um item')).toBeInTheDocument()
  })

  it('finalizar envia o payload certo e mostra a mensagem EXATA da API; o link abre o wa.me da API', async () => {
    const { cenario, roteador } = await comUmPratoNoCarrinho()
    await preencherDados()

    await userEvent.click(screen.getByRole('button', { name: 'Finalizar pedido' }))

    expect(await screen.findByRole('heading', { name: 'Pedido nº 14 registrado' })).toBeInTheDocument()
    expect(caminhoAtual(roteador)).toBe('/confirmacao/14')
    expect(cenario.chamadas.pedidos).toEqual([
      {
        nomeCliente: 'Maria',
        telefone: '31988887777',
        cardapioId: 5,
        itens: [{ opcaoId: 9, quantidade: 1 }],
        formaDePagamento: 'Pix',
        trocoPara: null,
        tipoDeEntrega: 'Retirada',
        endereco: null,
        referencia: null,
        observacao: null,
      },
    ])

    const caixa = screen.getByText(MENSAGEM_DO_PEDIDO, { normalizer: (texto) => texto })
    expect(caixa.textContent).toBe(MENSAGEM_DO_PEDIDO)
    expect(caixa.className).toContain('whitespace-pre-line')
    expect(screen.getByText('Agora é só enviar pro WhatsApp da loja. Ela confirma por lá.')).toBeInTheDocument()

    const link = screen.getByRole('link', { name: 'Enviar no WhatsApp' })
    expect(link).toHaveAttribute('href', 'https://wa.me/5531999999999?text=Pedido')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(sessionStorage.getItem('kf:ultimo-pedido')).toContain('"numero":14')
  })

  it('a mensagem e texto puro: HTML na mensagem nao vira elemento', async () => {
    const { cenario } = await comUmPratoNoCarrinho()
    cenario.respostaDoPedido = pedidoDeResposta({ mensagemWhatsApp: 'Obs.: <img src=x onerror=alert(1)> <b>negrito</b>' })
    await preencherDados()

    await userEvent.click(screen.getByRole('button', { name: 'Finalizar pedido' }))

    await screen.findByRole('heading', { name: 'Pedido nº 14 registrado' })
    expect(document.querySelector('img')).toBeNull()
    expect(document.querySelector('b')).toBeNull()
    expect(screen.getByText(/<b>negrito<\/b>/)).toBeInTheDocument()
  })

  it('"Enviar no WhatsApp" avisa a API sem impedir o link, mesmo se a chamada falhar', async () => {
    const { cenario } = await comUmPratoNoCarrinho()
    cenario.statusDoEnviado = 500
    await preencherDados()
    await userEvent.click(screen.getByRole('button', { name: 'Finalizar pedido' }))
    const link = await screen.findByRole('link', { name: 'Enviar no WhatsApp' })

    const impedidos: boolean[] = []
    document.addEventListener('click', (evento) => {
      impedidos.push(evento.defaultPrevented) // o jsdom nao navega: registramos se NOS bloqueamos o link
      evento.preventDefault()
    })
    await userEvent.click(link)

    await waitFor(() => expect(cenario.chamadas.enviados).toEqual([77]))
    expect(impedidos).toEqual([false]) // o link nao foi bloqueado pelo app
    expect(screen.getByRole('link', { name: 'Enviar no WhatsApp' })).toBeInTheDocument() // e nenhum erro derruba a tela
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('linkWhatsApp nulo: botao desabilitado e texto de apoio, mensagem continua visivel', async () => {
    const { cenario } = await comUmPratoNoCarrinho()
    cenario.respostaDoPedido = pedidoDeResposta({ linkWhatsApp: null })
    await preencherDados()

    await userEvent.click(screen.getByRole('button', { name: 'Finalizar pedido' }))

    expect(await screen.findByRole('button', { name: 'Enviar no WhatsApp' })).toBeDisabled()
    expect(screen.queryByRole('link', { name: 'Enviar no WhatsApp' })).not.toBeInTheDocument()
    expect(screen.getByText('A loja ainda não cadastrou o WhatsApp. Avise a loja pelo telefone.')).toBeInTheDocument()
    expect(screen.getByText(MENSAGEM_DO_PEDIDO, { normalizer: (texto) => texto })).toBeInTheDocument()
  })

  it('erro 400 aparece acima do botao, carrinho e formulario continuam e restaurante e cardapio sao reconsultados', async () => {
    const { cenario } = await comUmPratoNoCarrinho()
    cenario.respostaDoPedido = { status: 400, detail: 'O restaurante está fechado.' }
    await preencherDados()
    const antes = { restaurante: cenario.chamadas.restaurante, cardapio: cenario.chamadas.cardapio }

    await userEvent.click(screen.getByRole('button', { name: 'Finalizar pedido' }))

    expect(await screen.findByText('O restaurante está fechado.')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome')).toHaveValue('Maria')
    expect(screen.getByText('1x Prato 1')).toBeInTheDocument()
    await waitFor(() => {
      expect(cenario.chamadas.restaurante).toBeGreaterThan(antes.restaurante)
      expect(cenario.chamadas.cardapio).toBeGreaterThan(antes.cardapio)
    })
  })

  it('item que acabou depois de recarregar: aviso na linha e "Finalizar pedido" desabilitado', async () => {
    const { cenario } = await comUmPratoNoCarrinho()
    await preencherDados()
    expect(screen.getByRole('button', { name: 'Finalizar pedido' })).toBeEnabled()

    cenario.cardapio = {
      id: 5,
      dataPublicacao: '2026-11-08',
      situacao: 'Publicado',
      opcoes: OPCOES.map((o) => (o.id === 9 ? { ...o, esgotado: true } : o)),
    }
    act(() => {
      document.dispatchEvent(new Event('visibilitychange', { bubbles: true })) // a pessoa voltou para a janela
    })

    expect(await screen.findByText('Este item acabou. Remova para continuar.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Finalizar pedido' })).toBeDisabled()
  })

  it('"Fazer outro pedido" limpa carrinho e confirmacao e volta ao cardapio', async () => {
    const { roteador } = await comUmPratoNoCarrinho()
    await preencherDados()
    await userEvent.click(screen.getByRole('button', { name: 'Finalizar pedido' }))
    await screen.findByRole('heading', { name: 'Pedido nº 14 registrado' })

    await userEvent.click(screen.getByRole('button', { name: 'Fazer outro pedido' }))

    expect(caminhoAtual(roteador)).toBe('/')
    expect(await screen.findByRole('button', { name: 'Montar minha marmita' })).toBeInTheDocument()
    expect(sessionStorage.getItem('kf:ultimo-pedido')).toBeNull()
  })

  it('confirmacao aberta sem o dado do pedido volta para o cardapio', async () => {
    servirCliente()
    const { roteador } = renderizarApp('/confirmacao/14')

    await screen.findByRole('heading', { name: 'Monte sua marmita' })
    expect(caminhoAtual(roteador)).toBe('/')
  })

  it('recarregar a confirmacao recupera o pedido do sessionStorage', async () => {
    servirCliente()
    sessionStorage.setItem('kf:ultimo-pedido', JSON.stringify(pedidoDeResposta()))
    renderizarApp('/confirmacao/14')

    expect(await screen.findByRole('heading', { name: 'Pedido nº 14 registrado' })).toBeInTheDocument()
  })
})
