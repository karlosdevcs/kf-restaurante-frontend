import { formatBRL } from './formatar'
import { linhaDeEntregaEPagamento, linkParaChamarOCliente, mensagemParaOCliente, resumoDosItens } from './pedidoLoja'

describe('resumoDosItens', () => {
  it('"{quantidade}x {nome} ({componentes})", avulso sem parenteses', () => {
    expect(
      resumoDosItens([
        { nome: 'Marmita G', componentes: 'Arroz, Feijão', precoUnitario: 25, quantidade: 1, subtotal: 25 },
        { nome: 'Coca-Cola', componentes: null, precoUnitario: 6, quantidade: 2, subtotal: 12 },
      ]),
    ).toBe('1x Marmita G (Arroz, Feijão), 2x Coca-Cola')
  })

  it('lista vazia vira texto vazio', () => {
    expect(resumoDosItens([])).toBe('')
  })
})

describe('linhaDeEntregaEPagamento', () => {
  it('retirada e pix', () => {
    expect(linhaDeEntregaEPagamento({ tipoDeEntrega: 'Retirada', formaDePagamento: 'Pix' })).toBe('Retirada · Pix')
  })

  it('entrega com endereco; sem o detalhe ainda mostra so "Entrega"', () => {
    expect(linhaDeEntregaEPagamento({ tipoDeEntrega: 'Entrega', formaDePagamento: 'CartaoDeDebito' }, { endereco: 'Rua A, 10', trocoPara: null })).toBe(
      'Entrega, Rua A, 10 · Débito',
    )
    expect(linhaDeEntregaEPagamento({ tipoDeEntrega: 'Entrega', formaDePagamento: 'CartaoDeCredito' })).toBe('Entrega · Crédito')
  })

  it('dinheiro: "troco para R$ X" ou "sem troco" (so quando o detalhe chegou)', () => {
    const resumo = { tipoDeEntrega: 'Retirada', formaDePagamento: 'Dinheiro' } as const

    expect(linhaDeEntregaEPagamento(resumo, { endereco: null, trocoPara: 100 })).toBe(`Retirada · Dinheiro, troco para ${formatBRL(100)}`)
    expect(linhaDeEntregaEPagamento(resumo, { endereco: null, trocoPara: null })).toBe('Retirada · Dinheiro, sem troco')
    expect(linhaDeEntregaEPagamento(resumo)).toBe('Retirada · Dinheiro')
  })
})

describe('chamar o cliente no WhatsApp', () => {
  it('mensagem padrao', () => {
    expect(mensagemParaOCliente('Maria', 14)).toBe('Olá, Maria! Aqui é do KF Restaurante, sobre o seu pedido nº 14.')
  })

  it('wa.me com o 55 na frente do telefone (so DDD e numero) e a mensagem codificada', () => {
    const link = linkParaChamarOCliente({ telefone: '31988887777', nomeCliente: 'Maria', numero: 14 })

    expect(link).toBe(`https://wa.me/5531988887777?text=${encodeURIComponent('Olá, Maria! Aqui é do KF Restaurante, sobre o seu pedido nº 14.')}`)
  })

  it('telefone com mascara tambem vira so digitos', () => {
    expect(linkParaChamarOCliente({ telefone: '(31) 98888-7777', nomeCliente: 'Ana', numero: 1 })).toContain('https://wa.me/5531988887777?text=')
  })
})
