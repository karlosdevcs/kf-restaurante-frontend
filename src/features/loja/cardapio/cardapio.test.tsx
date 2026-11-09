import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { cardapioDeTeste, servirCardapioDoPainel } from '../../../test/cardapioPainel'
import { criarUsuario, guardarSessao, renderizarLoja, responderEu } from '../../../test/loja'
import { definirDesktop, removerMatchMedia } from '../../../test/matchMedia'
import { servirLoja } from '../../../test/pedidos'

afterEach(() => removerMatchMedia())

async function abrirCardapio(desktop = true) {
  definirDesktop(desktop)
  guardarSessao()
  responderEu(() => criarUsuario({ permissoes: ['GerenciarCardapio'] }))
  const retorno = renderizarLoja('/loja/cardapio')
  await screen.findByRole('heading', { name: 'Cardápio do dia' })
  return retorno
}

const marcar = (nome: string) => userEvent.click(screen.getByRole('checkbox', { name: nome }))
const marcadas = () => screen.getAllByRole('checkbox').filter((caixa) => caixa.getAttribute('aria-checked') === 'true')

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

  it('criar envia as opcoes marcadas e passa para Rascunho', async () => {
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
  })

  it('409 ao criar mostra a mensagem da API e continua no estado 1', async () => {
    servirLoja()
    servirCardapioDoPainel({ recusarCriacao: { status: 409, detail: 'Já existe um cardápio para a data 08/11/2026.' } })
    await abrirCardapio()
    await screen.findByRole('checkbox', { name: 'Carne 1' })

    await marcar('Carne 1')
    await userEvent.click(screen.getByRole('button', { name: 'Criar cardápio' }))

    expect(await screen.findByText('Já existe um cardápio para a data 08/11/2026.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Criar cardápio' })).toBeInTheDocument()
  })

  it('outro erro ao criar mostra a mensagem da API', async () => {
    servirLoja()
    servirCardapioDoPainel({ recusarCriacao: { status: 400, detail: 'Escolha pelo menos uma opção.' } })
    await abrirCardapio()
    await screen.findByRole('checkbox', { name: 'Carne 1' })

    await marcar('Carne 1')
    await userEvent.click(screen.getByRole('button', { name: 'Criar cardápio' }))

    expect(await screen.findByText('Escolha pelo menos uma opção.')).toBeInTheDocument()
  })
})

describe('estado 2: rascunho (agora o painel o enxerga e pode trocar as opcoes)', () => {
  it('o rascunho de hoje aparece direto, sem id guardado, com todas as opcoes e as do cardapio marcadas', async () => {
    servirLoja()
    servirCardapioDoPainel({ cardapio: cardapioDeTeste('Rascunho') })
    await abrirCardapio()

    expect(await screen.findByText('Rascunho')).toBeInTheDocument()
    expect(screen.getByText('Escolha feita. O cliente só vê depois que você publicar.')).toBeInTheDocument()
    expect(screen.getByText('Você pode trocar as opções até publicar.')).toBeInTheDocument()
    expect(await screen.findAllByRole('checkbox')).toHaveLength(9)
    expect(marcadas().map((caixa) => caixa.getAttribute('aria-label'))).toEqual(['Carne 1', 'Acompanhamento 1', 'Bebida 1'])
    expect(screen.getByText('3 opções no cardápio')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Salada 1' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Publicar cardápio' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Salvar opções' })).not.toBeInTheDocument()
  })

  it('trocar as opcoes mostra "Salvar opcoes", segura a publicacao e envia PUT /cardapios/{id}/opcoes', async () => {
    servirLoja()
    const cenario = servirCardapioDoPainel({ cardapio: cardapioDeTeste('Rascunho') })
    await abrirCardapio()
    await screen.findAllByRole('checkbox')

    await marcar('Salada 1')
    await marcar('Carne 1')

    expect(screen.getByText('3 opções no cardápio')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publicar cardápio' })).toBeDisabled()
    expect(screen.getByText('Salve as opções antes de publicar.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Salvar opções' }))

    await waitFor(() => expect(cenario.chamadas.alteradas).toEqual([{ id: 7, opcoesIds: [3, 7, 6] }]))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Salvar opções' })).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Publicar cardápio' })).toBeEnabled()
    expect(marcadas().map((caixa) => caixa.getAttribute('aria-label')).sort()).toEqual(['Acompanhamento 1', 'Bebida 1', 'Salada 1'])
  })

  it('voltar ao que ja estava salvo some com "Salvar opcoes"; sem nenhuma opcao nao salva', async () => {
    servirLoja()
    servirCardapioDoPainel({ cardapio: cardapioDeTeste('Rascunho', 7, [1]) })
    await abrirCardapio()
    await screen.findAllByRole('checkbox')

    await marcar('Salada 1')
    expect(screen.getByRole('button', { name: 'Salvar opções' })).toBeEnabled()
    await marcar('Salada 1')
    expect(screen.queryByRole('button', { name: 'Salvar opções' })).not.toBeInTheDocument()

    await marcar('Carne 1') // tira a unica opcao
    expect(screen.getByRole('button', { name: 'Salvar opções' })).toBeDisabled()
  })

  it('erro da API ao salvar vira banner e as marcacoes ficam', async () => {
    servirLoja()
    servirCardapioDoPainel({ cardapio: cardapioDeTeste('Rascunho'), recusarAlteracao: { status: 400, detail: 'Só é possível trocar as opções de um cardápio em rascunho.' } })
    await abrirCardapio()
    await screen.findAllByRole('checkbox')

    await marcar('Salada 1')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar opções' }))

    expect(await screen.findByText('Só é possível trocar as opções de um cardápio em rascunho.')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Salada 1' })).toHaveAttribute('aria-checked', 'true')
  })

  it('publicar chama /publicar e passa para Publicado', async () => {
    servirLoja()
    const cenario = servirCardapioDoPainel({ cardapio: cardapioDeTeste('Rascunho') })
    await abrirCardapio()

    await userEvent.click(await screen.findByRole('button', { name: 'Publicar cardápio' }))

    expect(await screen.findByText('Publicado')).toBeInTheDocument()
    expect(cenario.chamadas.publicados).toEqual([7])
    expect(screen.getByRole('button', { name: 'Fechar cardápio' })).toBeInTheDocument()
  })
})

describe('estados 3 e 4: publicado e fechado (opcoes so para leitura)', () => {
  it('publicado: pilula, texto de apoio, "Fechar cardapio" e checkboxes desabilitados', async () => {
    servirLoja()
    servirCardapioDoPainel({ cardapio: cardapioDeTeste('Publicado') })
    await abrirCardapio()

    expect(await screen.findByText('Publicado')).toBeInTheDocument()
    expect(screen.getByText('O cliente já está vendo. Pra tirar um item hoje, marque como esgotado na aba Hoje.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fechar cardápio' })).toBeInTheDocument()
    const caixas = screen.getAllByRole('checkbox')
    expect(caixas).toHaveLength(3)
    for (const caixa of caixas) expect(caixa).toBeDisabled()
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
