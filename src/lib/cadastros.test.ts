import type { Opcao, Tamanho } from '../api/tipos'
import {
  categoriaExigePreco,
  categoriasComLimite,
  categoriasDoFormulario,
  formularioDaOpcao,
  formularioDoTamanho,
  OPCAO_EM_BRANCO,
  ordenarOpcoes,
  payloadDaOpcao,
  payloadDoTamanho,
  payloadDosLimites,
  textoDoLimite,
  validarOpcao,
  validarTamanho,
  type FormularioDeOpcao,
  type FormularioDeTamanho,
} from './cadastros'
import { lerValorEmReais, valorParaCampo } from './dinheiro'

describe('lerValorEmReais e valorParaCampo', () => {
  it('virgula, ponto, milhar e R$; vazio vira null e lixo vira NaN', () => {
    expect(lerValorEmReais('12,5')).toBe(12.5)
    expect(lerValorEmReais('12.50')).toBe(12.5)
    expect(lerValorEmReais('R$ 1.000,00')).toBe(1000)
    expect(lerValorEmReais('')).toBeNull()
    expect(lerValorEmReais('abc')).toBeNaN()
    expect(lerValorEmReais('-3')).toBeNaN()
  })

  it('volta ao campo com virgula e duas casas', () => {
    expect(valorParaCampo(12.5)).toBe('12,50')
    expect(valorParaCampo(null)).toBe('')
  })
})

describe('opcao: regra do preco', () => {
  const base: FormularioDeOpcao = { ...OPCAO_EM_BRANCO, nome: 'Item' }

  it('Bebida e Sobremesa exigem preco; componentes nao', () => {
    expect(categoriaExigePreco('Bebida')).toBe(true)
    expect(categoriaExigePreco('Sobremesa')).toBe(true)
    expect(categoriaExigePreco('Carne')).toBe(false)
    expect(categoriaExigePreco('Guarnicao')).toBe(false)
  })

  it('nome obrigatorio', () => {
    expect(validarOpcao({ ...base, nome: '   ' })).toEqual({ nome: 'Informe o nome.' })
    expect(validarOpcao(base)).toEqual({})
  })

  it('bebida sem preco, com preco invalido ou negativo da erro; com preco valido passa', () => {
    const bebida = { ...base, categoria: 'Bebida' as const }

    expect(validarOpcao(bebida).preco).toBe('Informe o preço.')
    expect(validarOpcao({ ...bebida, preco: 'x' }).preco).toBe('Informe um preço válido, igual ou maior que zero.')
    expect(validarOpcao({ ...bebida, preco: '-1' }).preco).toBeDefined()
    expect(validarOpcao({ ...bebida, preco: '0' })).toEqual({}) // zero e permitido
    expect(validarOpcao({ ...bebida, preco: '6,5' })).toEqual({})
  })

  it('componente: sem "vender tambem avulsa" o preco nao e pedido nem enviado', () => {
    const carne = { ...base, categoria: 'Carne' as const, preco: '99' }

    expect(validarOpcao(carne)).toEqual({})
    expect(payloadDaOpcao(carne)).toEqual({ nome: 'Item', categoria: 'Carne', preco: null })
  })

  it('componente vendido tambem avulso exige e envia o preco', () => {
    const feijoada = { ...base, categoria: 'Carne' as const, vendeAvulsa: true }

    expect(validarOpcao(feijoada).preco).toBe('Informe o preço.')
    expect(payloadDaOpcao({ ...feijoada, preco: '25,00' })).toEqual({ nome: 'Item', categoria: 'Carne', preco: 25 })
  })

  it('o nome vai sem espacos nas pontas', () => {
    expect(payloadDaOpcao({ ...base, nome: '  Strogonoff  ' }).nome).toBe('Strogonoff')
  })

  it('editar preenche o formulario a partir da opcao (preco nulo = nao vende avulsa)', () => {
    const componente: Opcao = { id: 1, nome: 'Arroz', categoria: 'Acompanhamento', preco: null, esgotado: false }
    const avulsa: Opcao = { id: 2, nome: 'Suco', categoria: 'Bebida', preco: 6, esgotado: false }

    expect(formularioDaOpcao(componente)).toEqual({ nome: 'Arroz', categoria: 'Acompanhamento', vendeAvulsa: false, preco: '' })
    expect(formularioDaOpcao(avulsa)).toEqual({ nome: 'Suco', categoria: 'Bebida', vendeAvulsa: true, preco: '6,00' })
  })

  it('categoria desconhecida entra na grade do formulario', () => {
    expect(categoriasDoFormulario('Carne')).toHaveLength(6)
    expect(categoriasDoFormulario('Nova')).toEqual([...categoriasDoFormulario('Carne'), 'Nova'])
  })

  it('ordenar: componentes na ordem das categorias, bebida e sobremesa por ultimo, depois por nome', () => {
    const o = (id: number, nome: string, categoria: Opcao['categoria']): Opcao => ({ id, nome, categoria, preco: null, esgotado: false })

    expect(ordenarOpcoes([o(1, 'Suco', 'Bebida'), o(2, 'Salada A', 'Salada'), o(3, 'Carne B', 'Carne'), o(4, 'Carne A', 'Carne')]).map((x) => x.nome)).toEqual([
      'Carne A',
      'Carne B',
      'Salada A',
      'Suco',
    ])
  })
})

describe('tamanho e limites', () => {
  const valido: FormularioDeTamanho = { nome: 'M', preco: '20', limiteTotal: '3', limites: {} }

  it('validacao: nome, preco e limite total inteiro >= 0', () => {
    expect(validarTamanho(valido)).toEqual({})
    expect(validarTamanho({ ...valido, nome: '' }).nome).toBeDefined()
    expect(validarTamanho({ ...valido, preco: '' }).preco).toBe('Informe o preço.')
    expect(validarTamanho({ ...valido, preco: '-2' }).preco).toBeDefined()
    expect(validarTamanho({ ...valido, limiteTotal: '' }).limiteTotal).toBeDefined()
    expect(validarTamanho({ ...valido, limiteTotal: '2,5' }).limiteTotal).toBeDefined()
    expect(validarTamanho({ ...valido, limiteTotal: '-1' }).limiteTotal).toBeDefined()
    expect(validarTamanho({ ...valido, limiteTotal: '0' })).toEqual({}) // zero vale
  })

  it('payload do tamanho com os nomes do contrato', () => {
    expect(payloadDoTamanho({ ...valido, nome: ' M ', preco: '19,90' })).toEqual({ nome: 'M', preco: 19.9, limitedeComponente: 3 })
  })

  it('so as categorias de componente podem ter limite, na ordem da secao 12.1', () => {
    expect(categoriasComLimite()).toEqual(['Carne', 'Acompanhamento', 'Guarnicao', 'Salada'])
  })

  it('o PUT de limites SUBSTITUI tudo: so entram as categorias limitadas; lista vazia remove todos', () => {
    expect(payloadDosLimites({})).toEqual({ limites: [] })
    expect(payloadDosLimites({ Salada: 0, Carne: 2 })).toEqual({
      limites: [
        { categoria: 'Carne', maximo: 2 },
        { categoria: 'Salada', maximo: 0 }, // zero e um limite (categoria bloqueada), nao "sem limite"
      ],
    })
  })

  it('editar preenche o formulario e os limites atuais', () => {
    const tamanho: Tamanho = { id: 2, nome: 'M', preco: 20, limitedeComponente: 3, limites: [{ categoria: 'Carne', maximo: 1 }] }

    expect(formularioDoTamanho(tamanho)).toEqual({ nome: 'M', preco: '20,00', limiteTotal: '3', limites: { Carne: 1 } })
  })

  it('texto do limite: "Carne: ate 2" e "Salada: nao incluso"', () => {
    expect(textoDoLimite({ categoria: 'Carne', maximo: 2 })).toBe('Carne: até 2')
    expect(textoDoLimite({ categoria: 'Salada', maximo: 0 })).toBe('Salada: não incluso')
  })
})
