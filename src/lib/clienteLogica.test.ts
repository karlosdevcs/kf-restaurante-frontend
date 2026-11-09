import type { Opcao, Tamanho } from '../api/tipos'
import { formatBRL } from './formatar'
import { carrinhoReducer, itemEstaEsgotado, quantidadeDeItens, subtotalDoItem, totalDoCarrinho, type ItemDoCarrinho } from './carrinho'
import { FORMULARIO_INICIAL, lerTroco, montarPayloadDoPedido, primeiraPendencia, type FormularioDoPedido } from './pedidoCliente'
import { ajustarSelecaoAoTamanho, alternarSelecao, contarSelecao, limiteDaCategoria, tamanhoPadrao, tileBloqueado } from './regrasMarmita'

function opcao(id: number, categoria: Opcao['categoria'], extra: Partial<Opcao> = {}): Opcao {
  return { id, nome: `Item ${id}`, categoria, preco: null, esgotado: false, ...extra }
}

function mapa(...opcoes: Opcao[]) {
  return new Map(opcoes.map((o) => [o.id, o]))
}

const tamanho = (limitedeComponente: number, limites: Tamanho['limites'] = []): Tamanho => ({ id: 1, nome: 'M', preco: 20, limitedeComponente, limites })

describe('regrasMarmita: bloqueio dos tiles', () => {
  const opcoes = mapa(opcao(1, 'Carne'), opcao(2, 'Carne'), opcao(3, 'Carne'), opcao(4, 'Salada'), opcao(5, 'Salada', { esgotado: true }))

  it('livre quando nada foi marcado', () => {
    const t = tamanho(5, [{ categoria: 'Carne', maximo: 2 }])

    expect(tileBloqueado(opcoes.get(1)!, t, [], opcoes)).toBe(false)
  })

  it('bloqueia pelo total: atingiu o limite, quem nao esta marcado trava e quem esta marcado continua livre', () => {
    const t = tamanho(2)

    expect(tileBloqueado(opcoes.get(3)!, t, [1, 2], opcoes)).toBe(true)
    expect(tileBloqueado(opcoes.get(1)!, t, [1, 2], opcoes)).toBe(false) // desmarcar e sempre possivel
  })

  it('bloqueia pela categoria, sem travar as outras', () => {
    const t = tamanho(5, [{ categoria: 'Carne', maximo: 2 }])

    expect(tileBloqueado(opcoes.get(3)!, t, [1, 2], opcoes)).toBe(true)
    expect(tileBloqueado(opcoes.get(4)!, t, [1, 2], opcoes)).toBe(false)
  })

  it('bloqueia o esgotado, mesmo com folga nos limites', () => {
    expect(tileBloqueado(opcoes.get(5)!, tamanho(5), [], opcoes)).toBe(true)
  })

  it('maximo 0 bloqueia a categoria inteira', () => {
    const t = tamanho(5, [{ categoria: 'Salada', maximo: 0 }])

    expect(tileBloqueado(opcoes.get(4)!, t, [], opcoes)).toBe(true)
    expect(tileBloqueado(opcoes.get(1)!, t, [], opcoes)).toBe(false)
  })

  it('categoria sem entrada na lista nao tem limite proprio', () => {
    expect(limiteDaCategoria(tamanho(5, [{ categoria: 'Carne', maximo: 1 }]), 'Salada')).toBeNull()
  })

  it('contarSelecao conta total e por categoria, ignorando ids que nao existem mais', () => {
    expect(contarSelecao([1, 2, 4, 99], opcoes)).toEqual({ total: 3, porCategoria: { Carne: 2, Salada: 1 } })
  })

  it('alternar marca na ordem de selecao e desmarca livremente', () => {
    expect(alternarSelecao([], 3)).toEqual([3])
    expect(alternarSelecao([3], 1)).toEqual([3, 1])
    expect(alternarSelecao([3, 1], 3)).toEqual([1])
  })
})

describe('regrasMarmita: trocar de tamanho com selecao feita', () => {
  const opcoes = mapa(
    opcao(1, 'Carne'),
    opcao(2, 'Carne'),
    opcao(3, 'Carne'),
    opcao(4, 'Salada'),
    opcao(5, 'Acompanhamento'),
    opcao(6, 'Guarnicao'),
  )

  it('excesso de carnes: remove os marcados por ultimo', () => {
    const resultado = ajustarSelecaoAoTamanho([1, 4, 2, 3], tamanho(5, [{ categoria: 'Carne', maximo: 2 }]), opcoes)

    expect(resultado).toEqual([1, 4, 2])
  })

  it('excesso de total: corta mantendo os primeiros marcados', () => {
    const resultado = ajustarSelecaoAoTamanho([5, 6, 4, 1], tamanho(2), opcoes)

    expect(resultado).toEqual([5, 6])
  })

  it('categoria e total juntos: aplica a categoria primeiro e depois o total', () => {
    // 3 carnes (limite 1 -> sobra a 1a), depois salada e acompanhamento; total 2 -> corta o acompanhamento
    const resultado = ajustarSelecaoAoTamanho([1, 2, 3, 4, 5], tamanho(2, [{ categoria: 'Carne', maximo: 1 }]), opcoes)

    expect(resultado).toEqual([1, 4])
  })

  it('nada a cortar: a selecao fica igual', () => {
    expect(ajustarSelecaoAoTamanho([1, 4, 5], tamanho(5, [{ categoria: 'Carne', maximo: 2 }]), opcoes)).toEqual([1, 4, 5])
  })

  it('maximo 0 remove a categoria inteira', () => {
    expect(ajustarSelecaoAoTamanho([1, 4], tamanho(5, [{ categoria: 'Carne', maximo: 0 }]), opcoes)).toEqual([4])
  })
})

describe('tamanhoPadrao', () => {
  it('o do meio; o primeiro quando ha menos de 3; vazio vira undefined', () => {
    expect(tamanhoPadrao(['P', 'M', 'G'])).toBe('M')
    expect(tamanhoPadrao(['P', 'G'])).toBe('P')
    expect(tamanhoPadrao(['P'])).toBe('P')
    expect(tamanhoPadrao([])).toBeUndefined()
  })
})

describe('carrinho', () => {
  const m = (chave: string, itens: number[] = [1]) => ({ tipo: 'adicionar-marmita' as const, chave, tamanho: { id: 2, nome: 'M', preco: 20 }, componentesIds: itens })

  it('cada marmita montada e uma linha separada, mesmo identica a outra', () => {
    let itens: ItemDoCarrinho[] = []
    itens = carrinhoReducer(itens, m('m1'))
    itens = carrinhoReducer(itens, m('m2'))

    expect(itens).toHaveLength(2)
    expect(itens.every((item) => item.quantidade === 1)).toBe(true)
  })

  it('avulso agrupa por opcao e soma a quantidade', () => {
    let itens: ItemDoCarrinho[] = []
    const refri = { id: 9, nome: 'Refri', preco: 6 }
    itens = carrinhoReducer(itens, { tipo: 'adicionar-avulso', opcao: refri })
    itens = carrinhoReducer(itens, { tipo: 'adicionar-avulso', opcao: refri })

    expect(itens).toHaveLength(1)
    expect(itens[0]?.quantidade).toBe(2)
  })

  it('quantidade 0 remove a linha; limpar esvazia', () => {
    let itens = carrinhoReducer([], m('m1'))
    itens = carrinhoReducer(itens, { tipo: 'mudar-quantidade', chave: 'm1', quantidade: 3 })
    expect(itens[0]?.quantidade).toBe(3)

    itens = carrinhoReducer(itens, { tipo: 'mudar-quantidade', chave: 'm1', quantidade: 0 })
    expect(itens).toEqual([])
    expect(carrinhoReducer(carrinhoReducer([], m('m1')), { tipo: 'limpar' })).toEqual([])
  })

  it('total e subtotal em centavos inteiros (sem erro de ponto flutuante)', () => {
    const itens: ItemDoCarrinho[] = [
      { tipo: 'avulso', chave: 'a-1', opcaoId: 1, nome: 'A', quantidade: 3, precoUnitario: 0.1 },
      { tipo: 'avulso', chave: 'a-2', opcaoId: 2, nome: 'B', quantidade: 1, precoUnitario: 0.2 },
    ]

    expect(totalDoCarrinho(itens)).toBe(0.5)
    expect(subtotalDoItem(itens[0]!)).toBe(0.3)
    expect(quantidadeDeItens(itens)).toBe(4)
  })

  it('item esgotado depois de recarregar: componente esgotado ou que saiu do cardapio', () => {
    const marmita = carrinhoReducer([], m('m1', [1, 2]))[0]!

    expect(itemEstaEsgotado(marmita, mapa(opcao(1, 'Carne'), opcao(2, 'Salada')))).toBe(false)
    expect(itemEstaEsgotado(marmita, mapa(opcao(1, 'Carne'), opcao(2, 'Salada', { esgotado: true })))).toBe(true)
    expect(itemEstaEsgotado(marmita, mapa(opcao(1, 'Carne')))).toBe(true)
  })
})

describe('validacao do formulario do cliente', () => {
  // o valor sai de formatBRL (usa espaco inseparavel); o total dos itens abaixo e 2 x 25
  const MENSAGEM_DO_TROCO = `O troco precisa ser maior ou igual ao total (${formatBRL(50)}).`
  const itens: ItemDoCarrinho[] = [{ tipo: 'avulso', chave: 'a-1', opcaoId: 1, nome: 'Item', quantidade: 2, precoUnitario: 25 }]
  const valido: FormularioDoPedido = { ...FORMULARIO_INICIAL, nome: 'Maria', telefone: '(31) 98888-7777' }

  it('as 5 pendencias saem na ordem certa', () => {
    expect(primeiraPendencia([], FORMULARIO_INICIAL)).toBe('Adicione pelo menos um item')
    expect(primeiraPendencia(itens, FORMULARIO_INICIAL)).toBe('Preencha seu nome pra finalizar')
    expect(primeiraPendencia(itens, { ...FORMULARIO_INICIAL, nome: '   ' })).toBe('Preencha seu nome pra finalizar')
    expect(primeiraPendencia(itens, { ...FORMULARIO_INICIAL, nome: 'Maria' })).toBe('Preencha seu WhatsApp com DDD')
    expect(primeiraPendencia(itens, { ...valido, tipoDeEntrega: 'Entrega' })).toBe('Preencha o endereço de entrega')
    expect(primeiraPendencia(itens, { ...valido, formaDePagamento: 'Dinheiro', troco: '30' })).toBe(MENSAGEM_DO_TROCO)
  })

  it('so a primeira pendencia aparece quando ha varias', () => {
    expect(primeiraPendencia(itens, { ...FORMULARIO_INICIAL, tipoDeEntrega: 'Entrega' })).toBe('Preencha seu nome pra finalizar')
  })

  it('telefone com e sem mascara: conta so os digitos (minimo 10)', () => {
    expect(primeiraPendencia(itens, { ...valido, telefone: '31988887777' })).toBeNull()
    expect(primeiraPendencia(itens, { ...valido, telefone: '(31) 8888-7777' })).toBeNull()
    expect(primeiraPendencia(itens, { ...valido, telefone: '(31) 8888-777' })).toBe('Preencha seu WhatsApp com DDD')
  })

  it('entrega com endereco passa; retirada nao exige endereco', () => {
    expect(primeiraPendencia(itens, { ...valido, tipoDeEntrega: 'Entrega', endereco: 'Rua A, 10' })).toBeNull()
    expect(primeiraPendencia(itens, valido)).toBeNull()
  })

  it('troco: opcional, igual ou maior que o total passa, aceita virgula e ponto, e so vale com Dinheiro', () => {
    const dinheiro = { ...valido, formaDePagamento: 'Dinheiro' as const }

    expect(primeiraPendencia(itens, { ...dinheiro, troco: '' })).toBeNull()
    expect(primeiraPendencia(itens, { ...dinheiro, troco: '50' })).toBeNull()
    expect(primeiraPendencia(itens, { ...dinheiro, troco: '100,50' })).toBeNull()
    expect(primeiraPendencia(itens, { ...dinheiro, troco: '49,99' })).toBe(MENSAGEM_DO_TROCO)
    expect(primeiraPendencia(itens, { ...dinheiro, troco: 'abc' })).toBe(MENSAGEM_DO_TROCO)
    // com Pix o troco digitado antes e ignorado
    expect(primeiraPendencia(itens, { ...valido, formaDePagamento: 'Pix', troco: '1' })).toBeNull()
  })

  it('lerTroco entende virgula, ponto, milhar e R$', () => {
    expect(lerTroco('100')).toBe(100)
    expect(lerTroco('100,5')).toBe(100.5)
    expect(lerTroco('100.50')).toBe(100.5)
    expect(lerTroco('R$ 1.000,50')).toBe(1000.5)
    expect(lerTroco('')).toBeNull()
    expect(lerTroco('x')).toBeNaN()
  })
})

describe('payload de POST /pedidos', () => {
  const itens: ItemDoCarrinho[] = [
    { tipo: 'avulso', chave: 'a-9', opcaoId: 9, nome: 'Item avulso', quantidade: 1, precoUnitario: 25 },
    { tipo: 'marmita', chave: 'm1', tamanhoId: 2, nomeDoTamanho: 'M', componentesIds: [4, 1, 7], quantidade: 2, precoUnitario: 20 },
  ]

  it('avulso preenche so opcaoId e marmita preenche tamanhoId e componentesIds, nunca os dois', () => {
    const payload = montarPayloadDoPedido(5, itens, { ...FORMULARIO_INICIAL, nome: ' Maria ', telefone: '(31) 98888-7777' })

    expect(payload.itens).toEqual([
      { opcaoId: 9, quantidade: 1 },
      { tamanhoId: 2, componentesIds: [4, 1, 7], quantidade: 2 },
    ])
    expect(payload.itens[0]).not.toHaveProperty('tamanhoId')
    expect(payload.itens[1]).not.toHaveProperty('opcaoId')
  })

  it('retirada: sem endereco e sem referencia, mesmo que o cliente tenha digitado antes; telefone so com digitos', () => {
    const payload = montarPayloadDoPedido(5, itens, {
      ...FORMULARIO_INICIAL,
      nome: 'Maria',
      telefone: '(31) 98888-7777',
      endereco: 'Rua A, 10',
      referencia: 'portao azul',
    })

    expect(payload).toMatchObject({ cardapioId: 5, nomeCliente: 'Maria', telefone: '31988887777', tipoDeEntrega: 'Retirada', endereco: null, referencia: null })
  })

  it('entrega: endereco e referencia vao; referencia vazia vira null', () => {
    const base = { ...FORMULARIO_INICIAL, nome: 'Maria', telefone: '31988887777', tipoDeEntrega: 'Entrega' as const, endereco: ' Rua A, 10 ' }

    expect(montarPayloadDoPedido(5, itens, { ...base, referencia: 'portao azul' })).toMatchObject({ endereco: 'Rua A, 10', referencia: 'portao azul' })
    expect(montarPayloadDoPedido(5, itens, { ...base, referencia: '  ' }).referencia).toBeNull()
  })

  it('troco so em dinheiro; observacao vazia vira null', () => {
    const base = { ...FORMULARIO_INICIAL, nome: 'Maria', telefone: '31988887777', troco: '100,00' }

    expect(montarPayloadDoPedido(5, itens, { ...base, formaDePagamento: 'Dinheiro' })).toMatchObject({ formaDePagamento: 'Dinheiro', trocoPara: 100, observacao: null })
    expect(montarPayloadDoPedido(5, itens, { ...base, formaDePagamento: 'Pix' }).trocoPara).toBeNull()
    expect(montarPayloadDoPedido(5, itens, { ...base, formaDePagamento: 'Dinheiro', troco: '' }).trocoPara).toBeNull()
    expect(montarPayloadDoPedido(5, itens, { ...base, observacao: ' sem cebola ' }).observacao).toBe('sem cebola')
  })
})
