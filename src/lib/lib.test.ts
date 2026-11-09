import { categoriaInfo, ehComponenteDeMarmita, ordenarCategoriasDeComponente } from './categoriaConfig'
import { formatBRL, formatDataCabecalho, formatDataIso, formatHora, formatTelefone, formatWhatsAppLoja, hojeEmBrasilia, iniciais, lerUtc, pluralizar, rotuloPagamento, somenteDigitos } from './formatar'
import { contarPorStatus, filtrarPorStatus, infoDoStatus } from './statusPedido'
import type { PedidoResumo } from '../api/tipos'

// O Intl usa espaco inseparavel (U+00A0) entre "R$" e o valor: normaliza para comparar
const semNbsp = (texto: string) => texto.replace(/ /g, ' ')

describe('categoriaConfig', () => {
  it('Guarnicao (sem cedilha, como a API manda) vira "Guarnição"', () => {
    expect(categoriaInfo('Guarnicao').rotulo).toBe('Guarnição')
    expect(categoriaInfo('Guarnicao').rotuloCurto).toBe('Guarnição')
  })

  it('Acompanhamento tem rotulo curto "Acomp."', () => {
    expect(categoriaInfo('Acompanhamento').rotuloCurto).toBe('Acomp.')
  })

  it('categoria desconhecida nao quebra: usa o proprio nome, cor neutra e e tratada como componente', () => {
    const info = categoriaInfo('CategoriaNova')

    expect(info.rotulo).toBe('CategoriaNova')
    expect(info.cor).toBe('var(--cat-desconhecida)')
    expect(info.componente).toBe(true)
    expect(ehComponenteDeMarmita('CategoriaNova')).toBe(true)
  })

  it('Bebida e Sobremesa nao sao componentes de marmita', () => {
    expect(ehComponenteDeMarmita('Bebida')).toBe(false)
    expect(ehComponenteDeMarmita('Sobremesa')).toBe(false)
  })

  it('ordem dos grupos: Carne, Acompanhamento, Guarnicao, Salada; bebida e sobremesa de fora; desconhecidas por ultimo', () => {
    const ordenadas = ordenarCategoriasDeComponente(['Salada', 'Bebida', 'Guarnicao', 'Nova', 'Carne', 'Sobremesa', 'Acompanhamento', 'Carne'])

    expect(ordenadas).toEqual(['Carne', 'Acompanhamento', 'Guarnicao', 'Salada', 'Nova'])
  })

  it('a ordem de exibicao NAO depende dos numeros do enum do backend', () => {
    // no backend Guarnicao = 4 e Bebida = 2, mas a exibicao segue a tabela da spec
    expect(categoriaInfo('Guarnicao').ordem).toBeLessThan(categoriaInfo('Salada').ordem)
  })

  it('plural em portugues: "carnes", "guarnições"', () => {
    expect(categoriaInfo('Carne').plural).toBe('carnes')
    expect(categoriaInfo('Guarnicao').plural).toBe('guarnições')
  })
})

describe('formatBRL', () => {
  it('sempre com duas casas', () => {
    expect(semNbsp(formatBRL(16))).toBe('R$ 16,00')
    expect(semNbsp(formatBRL(25.5))).toBe('R$ 25,50')
    expect(semNbsp(formatBRL(0))).toBe('R$ 0,00')
  })

  it('separador de milhar', () => {
    expect(semNbsp(formatBRL(1234.5))).toBe('R$ 1.234,50')
  })
})

describe('hora em Sao Paulo a partir de UTC', () => {
  it('converte UTC com Z para o horario de Brasilia (UTC-3)', () => {
    expect(formatHora('2026-11-08T23:30:00Z')).toBe('20:30')
  })

  it('trata string SEM fuso como UTC', () => {
    expect(formatHora('2026-11-08T23:30:00')).toBe('20:30')
    expect(lerUtc('2026-11-08T23:30:00').toISOString()).toBe('2026-11-08T23:30:00.000Z')
  })

  it('respeita offset explicito', () => {
    expect(formatHora('2026-11-08T20:30:00-03:00')).toBe('20:30')
  })

  it('meia-noite local aparece como 00:xx, nao 24:xx', () => {
    expect(formatHora('2026-11-09T03:05:00Z')).toBe('00:05')
  })

  it('o "hoje" e o de Brasilia: 23h30 em Brasilia ainda e o mesmo dia, mesmo ja sendo amanha em UTC', () => {
    expect(hojeEmBrasilia(new Date('2026-11-09T02:30:00Z'))).toBe('2026-11-08')
    expect(hojeEmBrasilia(new Date('2026-11-09T03:00:00Z'))).toBe('2026-11-09')
  })

  it('cabecalho: dia da semana, dia e mes por extenso', () => {
    expect(formatDataCabecalho(new Date('2026-11-08T15:00:00Z'))).toBe('domingo, 8 de novembro')
  })

  it('data da API em formato brasileiro', () => {
    expect(formatDataIso('2026-11-08')).toBe('08/11/2026')
  })
})

describe('singular e plural', () => {
  it('1 item / 2 itens', () => {
    expect(pluralizar(1, 'item', 'itens')).toBe('1 item')
    expect(pluralizar(2, 'item', 'itens')).toBe('2 itens')
    expect(pluralizar(0, 'item', 'itens')).toBe('0 itens')
  })

  it('1 carne / 2 carnes', () => {
    expect(pluralizar(1, 'carne', 'carnes')).toBe('1 carne')
    expect(pluralizar(2, 'carne', 'carnes')).toBe('2 carnes')
  })
})

describe('telefone', () => {
  it('11 digitos', () => {
    expect(formatTelefone('62998124471')).toBe('(62) 99812-4471')
  })

  it('10 digitos', () => {
    expect(formatTelefone('6298124471')).toBe('(62) 9812-4471')
  })

  it('aceita entrada ja mascarada', () => {
    expect(formatTelefone('(62) 99812-4471')).toBe('(62) 99812-4471')
  })

  it('tamanho inesperado volta como veio', () => {
    expect(formatTelefone('123')).toBe('123')
  })

  it('somenteDigitos remove mascara', () => {
    expect(somenteDigitos('(62) 99812-4471')).toBe('62998124471')
  })
})

describe('WhatsApp da loja', () => {
  it('celular de 13 digitos', () => {
    expect(formatWhatsAppLoja('5531999999999')).toBe('+55 (31) 99999-9999')
  })

  it('fixo de 12 digitos', () => {
    expect(formatWhatsAppLoja('553133334444')).toBe('+55 (31) 3333-4444')
  })

  it('nao cadastrado vira texto vazio', () => {
    expect(formatWhatsAppLoja(null)).toBe('')
  })
})

describe('rotulos', () => {
  it('pagamento curto e longo', () => {
    expect(rotuloPagamento('CartaoDeDebito')).toBe('Débito')
    expect(rotuloPagamento('CartaoDeDebito', 'longo')).toBe('Cartão de débito')
    expect(rotuloPagamento('CartaoDeCredito')).toBe('Crédito')
    expect(rotuloPagamento('Pix')).toBe('Pix')
  })

  it('forma de pagamento desconhecida volta como veio', () => {
    expect(rotuloPagamento('Cheque')).toBe('Cheque')
  })

  it('iniciais do nome', () => {
    expect(iniciais('Maria da Silva')).toBe('MS')
    expect(iniciais('Ana')).toBe('A')
    expect(iniciais('  ')).toBe('?')
  })
})

function pedido(id: number, status: string): PedidoResumo {
  return {
    id,
    numero: id,
    horaPedido: '2026-11-08T23:30:00Z',
    nomeCliente: 'Cliente',
    telefone: '62998124471',
    status,
    formaDePagamento: 'Pix',
    tipoDeEntrega: 'Retirada',
    total: 10,
  }
}

describe('status do pedido', () => {
  it('Gerado vira "Não enviado" em tom de aviso; Enviado vira "Enviado" neutro', () => {
    expect(infoDoStatus('Gerado')).toEqual({ rotulo: 'Não enviado', tom: 'aviso' })
    expect(infoDoStatus('Enviado')).toEqual({ rotulo: 'Enviado', tom: 'neutro' })
  })

  it('status desconhecido mostra o proprio nome, sem quebrar', () => {
    expect(infoDoStatus('Cancelado')).toEqual({ rotulo: 'Cancelado', tom: 'neutro' })
  })

  it('contadores dos filtros', () => {
    const lista = [pedido(1, 'Gerado'), pedido(2, 'Enviado'), pedido(3, 'Gerado'), pedido(4, 'Cancelado')]

    expect(contarPorStatus(lista)).toEqual({ todos: 4, enviado: 1, naoEnviado: 2 })
  })

  it('filtra por status', () => {
    const lista = [pedido(1, 'Gerado'), pedido(2, 'Enviado'), pedido(3, 'Gerado')]

    expect(filtrarPorStatus(lista, 'todos')).toHaveLength(3)
    expect(filtrarPorStatus(lista, 'enviado').map((p) => p.id)).toEqual([2])
    expect(filtrarPorStatus(lista, 'naoEnviado').map((p) => p.id)).toEqual([1, 3])
  })

  it('lista vazia nao quebra os contadores', () => {
    expect(contarPorStatus([])).toEqual({ todos: 0, enviado: 0, naoEnviado: 0 })
  })
})
