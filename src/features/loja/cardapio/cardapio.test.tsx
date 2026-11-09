import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { hojeEmBrasilia } from '../../../lib/formatar'
import { cardapioDeTeste, servirCardapioDoPainel } from '../../../test/cardapioPainel'
import { criarUsuario, guardarSessao, renderizarLoja, responderEu } from '../../../test/loja'
import { definirDesktop, removerMatchMedia } from '../../../test/matchMedia'
import { servirLoja } from '../../../test/pedidos'

afterEach(() => {
  removerMatchMedia()
  localStorage.clear()
})

async function abrirCardapio(desktop = true) {
  definirDesktop(desktop)
  guardarSessao()
  responderEu(() => criarUsuario({ permissoes: ['GerenciarCardapio'] }))
  const retorno = renderizarLoja('/loja/cardapio')
  await screen.findByRole('heading', { name: 'Cardápio do dia' })
  return retorno
}

const marcar = (nome: string) => userEvent.click(screen.getByRole('checkbox', { name: nome }))

describe('estado 1: sem cardapio de hoje', () => {
  it('mostra todas as opcoes, contador e "Criar cardapio" desabilitado com 0 marcadas', async () => {
    servirLoja()
    servirCardapioDoPainel()
    await abrirCardapio()

    expect(await screen.findByRole('checkbox', { name: 'Carne 1' })).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox')).toHaveLength(9) // todas as opcoes cadastradas, inclusive bebida e sobremesa
    expect(screen.getByText('0 opções no cardápio')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Criar cardápio' })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'Bebida 1' })).not.toBeDisabled()
    expect(screen.queryByText('Rascunho')).not.toBeInTheDocument()
  })

  it('cada opcao mostra a categoria e, se tiver, o preco', async () => {
    servirLoja()
    servirCardapioDoPainel()
    await abrirCardapio()
    await screen.findByRole('checkbox', { name: 'Bebida 1' })

    expect(screen.getByRole('checkbox', { name: 'Bebida 1' })).toHaveTextContent(/Bebida · R\$\s6,00/)
    expect(screen.getByRole('checkbox', { name: 'Carne 1' })).toHaveTextContent('Carne')
    expect(screen.getByRole('checkbox', { name: 'Carne 1' })).not.toHaveTextContent('R$')
  })

  it('criar envia as opcoes marcadas e passa para Rascunho, guardando so o id do dia', async () => {
    servirLoja()
    const cenario = servirCardapioDoPainel()
    await abrirCardapio()
    await screen.findByRole('checkbox', { name: 'Carne 1' })

    await marcar('Carne 1')
    await marcar('Bebida 1')
    expect(screen.getByText('2 opções no cardápio')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Criar cardápio' }))

    expect(await screen.findByText('Rascunho')).toBeInTheDocument()
    expect(cenario.chamadas.criados).toEqual([[1, 7]])
    expect(screen.getByRole('button', { name: 'Publicar cardápio' })).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('kf:cardapio-hoje') ?? '{}')).toEqual({ data: hojeEmBrasilia(), id: 7 })
  })

  it('409 ao criar: mostra a mensagem da API e a explicacao do rascunho que o painel nao acha', async () => {
    servirLoja()
    servirCardapioDoPainel({ recusarCriacao: { status: 409, detail: 'Já existe um cardápio para a data 2026-11-08.' } })
    await abrirCardapio()
    await screen.findByRole('checkbox', { name: 'Carne 1' })

    await marcar('Carne 1')
    await userEvent.click(screen.getByRole('button', { name: 'Criar cardápio' }))

    expect(await screen.findByText('Já existe um cardápio para a data 2026-11-08.')).toBeInTheDocument()
    expect(screen.getByText('Esse cardápio está em rascunho e não pode ser aberto por este painel.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Criar cardápio' })).toBeInTheDocument() // continua no estado 1
  })

  it('outro erro ao criar mostra so a mensagem, sem a explicacao do 409', async () => {
    servirLoja()
    servirCardapioDoPainel({ recusarCriacao: { status: 400, detail: 'Escolha pelo menos uma opção.' } })
    await abrirCardapio()
    await screen.findByRole('checkbox', { name: 'Carne 1' })

    await marcar('Carne 1')
    await userEvent.click(screen.getByRole('button', { name: 'Criar cardápio' }))

    expect(await screen.findByText('Escolha pelo menos uma opção.')).toBeInTheDocument()
    expect(screen.queryByText(/rascunho e não pode ser aberto/)).not.toBeInTheDocument()
  })
})

describe('estado 2: rascunho', () => {
  it('reencontra o rascunho pelo id guardado de hoje, lista as opcoes (so leitura) e oferece "Publicar cardapio"', async () => {
    servirLoja()
    const cenario = servirCardapioDoPainel({ cardapio: cardapioDeTeste('Rascunho') })
    localStorage.setItem('kf:cardapio-hoje', JSON.stringify({ data: hojeEmBrasilia(), id: 7 }))
    await abrirCardapio()

    expect(await screen.findByText('Rascunho')).toBeInTheDocument()
    expect(cenario.chamadas.porId).toEqual([7])
    expect(screen.getByText('Escolha feita. O cliente só vê depois que você publicar.')).toBeInTheDocument()
    expect(screen.getByText('Hoje não dá para trocar as opções de um cardápio criado.')).toBeInTheDocument()
    expect(screen.getByText('3 opções no cardápio')).toBeInTheDocument()
    const caixas = screen.getAllByRole('checkbox')
    expect(caixas).toHaveLength(3)
    for (const caixa of caixas) {
      expect(caixa).toBeDisabled()
      expect(caixa).toHaveAttribute('aria-checked', 'true')
    }
    expect(screen.getByRole('button', { name: 'Publicar cardápio' })).toBeInTheDocument()
  })

  it('id guardado de outro dia e ignorado: volta ao estado 1', async () => {
    servirLoja()
    const cenario = servirCardapioDoPainel({ cardapio: cardapioDeTeste('Rascunho') })
    localStorage.setItem('kf:cardapio-hoje', JSON.stringify({ data: '2000-01-01', id: 7 }))
    await abrirCardapio()

    expect(await screen.findByRole('button', { name: 'Criar cardápio' })).toBeInTheDocument()
    expect(cenario.chamadas.porId).toEqual([])
  })

  it('id guardado que nao existe mais (404) cai no estado 1', async () => {
    servirLoja()
    servirCardapioDoPainel({ cardapio: null })
    localStorage.setItem('kf:cardapio-hoje', JSON.stringify({ data: hojeEmBrasilia(), id: 99 }))
    await abrirCardapio()

    expect(await screen.findByRole('button', { name: 'Criar cardápio' })).toBeInTheDocument()
  })

  it('publicar chama /publicar e passa para Publicado', async () => {
    servirLoja()
    const cenario = servirCardapioDoPainel({ cardapio: cardapioDeTeste('Rascunho') })
    localStorage.setItem('kf:cardapio-hoje', JSON.stringify({ data: hojeEmBrasilia(), id: 7 }))
    await abrirCardapio()

    await userEvent.click(await screen.findByRole('button', { name: 'Publicar cardápio' }))

    expect(await screen.findByText('Publicado')).toBeInTheDocument()
    expect(cenario.chamadas.publicados).toEqual([7])
    expect(screen.getByRole('button', { name: 'Fechar cardápio' })).toBeInTheDocument()
  })
})

describe('estados 3 e 4: publicado e fechado', () => {
  it('publicado: pilula, texto de apoio e "Fechar cardapio"; o GET /cardapios/hoje o encontra sem id guardado', async () => {
    servirLoja()
    const cenario = servirCardapioDoPainel({ cardapio: cardapioDeTeste('Publicado') })
    await abrirCardapio()

    expect(await screen.findByText('Publicado')).toBeInTheDocument()
    expect(screen.getByText('O cliente já está vendo. Pra tirar um item hoje, marque como esgotado na aba Hoje.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fechar cardápio' })).toBeInTheDocument()
    expect(cenario.chamadas.porId).toEqual([])
  })

  it('fechar passa para Fechado ("Encerrado por hoje.") e reabrir chama /publicar', async () => {
    servirLoja()
    const cenario = servirCardapioDoPainel({ cardapio: cardapioDeTeste('Publicado') })
    await abrirCardapio()

    await userEvent.click(await screen.findByRole('button', { name: 'Fechar cardápio' }))

    expect(await screen.findByText('Fechado')).toBeInTheDocument()
    expect(screen.getByText('Encerrado por hoje.')).toBeInTheDocument()
    expect(cenario.chamadas.fechados).toEqual([7])

    await userEvent.click(screen.getByRole('button', { name: 'Reabrir cardápio' }))

    expect(await screen.findByText('Publicado')).toBeInTheDocument()
    expect(cenario.chamadas.publicados).toEqual([7]) // reabrir e o mesmo POST /publicar
  })

  it('cardapio ja fechado ao abrir mostra "Reabrir cardapio"', async () => {
    servirLoja()
    servirCardapioDoPainel({ cardapio: cardapioDeTeste('Fechado') })
    await abrirCardapio()

    expect(await screen.findByRole('button', { name: 'Reabrir cardápio' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Criar cardápio' })).not.toBeInTheDocument()
  })

  it('erro ao publicar vira banner no topo e nao muda o estado', async () => {
    servirLoja()
    servirCardapioDoPainel({ cardapio: cardapioDeTeste('Rascunho') })
    localStorage.setItem('kf:cardapio-hoje', JSON.stringify({ data: hojeEmBrasilia(), id: 7 }))
    const { http, HttpResponse } = await import('msw')
    const { servidor } = await import('../../../test/servidor')
    servidor.use(
      http.post('http://localhost:5000/cardapios/:id/publicar', () =>
        HttpResponse.json({ status: 400, title: 'Regra de negócio violada.', detail: 'Não foi possível publicar agora.' }, { status: 400 }),
      ),
    )
    await abrirCardapio()

    await userEvent.click(await screen.findByRole('button', { name: 'Publicar cardápio' }))

    expect(await screen.findByText('Não foi possível publicar agora.')).toBeInTheDocument()
    expect(screen.getByText('Rascunho')).toBeInTheDocument()
  })
})

describe('celular', () => {
  it('contador curto e botao de acao no fim da tela', async () => {
    servirLoja()
    servirCardapioDoPainel({ cardapio: cardapioDeTeste('Publicado') })
    await abrirCardapio(false)

    expect(await screen.findByText('3 opções')).toBeInTheDocument()
    expect(screen.queryByText('3 opções no cardápio')).not.toBeInTheDocument()
    const botao = screen.getByRole('button', { name: 'Fechar cardápio' })
    expect(botao.closest('div')?.className).toContain('sticky')
    await waitFor(() => expect(within(screen.getByRole('list', { name: 'Opções do cardápio' })).getAllByRole('checkbox')).toHaveLength(3))
  })
})
