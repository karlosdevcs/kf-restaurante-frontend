import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { AvailabilityToggle, BottomTabBar, ClientStatusBadge, IngredientTile, LineStepper, OrderStatusPill, StatusButton, Stepper, Tabs } from '.'

describe('StatusButton', () => {
  it('com permissao e um botao, com aria-label que diz o estado e a acao', async () => {
    const aoAlternar = vi.fn()
    const { rerender } = render(<StatusButton aberta aoAlternar={aoAlternar} />)

    const botao = screen.getByRole('button', { name: 'Loja aberta. Clicar para fechar' })
    expect(botao).toHaveTextContent('Loja aberta')

    await userEvent.click(botao)
    expect(aoAlternar).toHaveBeenCalledOnce()

    rerender(<StatusButton aberta={false} aoAlternar={aoAlternar} />)
    expect(screen.getByRole('button', { name: 'Loja fechada. Clicar para abrir' })).toHaveTextContent('Loja fechada')
  })

  it('SEM permissao vira o mesmo visual, mas NAO e botao', () => {
    render(<StatusButton aberta />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText('Loja aberta')).toBeInTheDocument()
  })

  it('no celular usa os textos curtos', () => {
    const { rerender } = render(<StatusButton aberta tamanho="celular" aoAlternar={() => undefined} />)
    expect(screen.getByRole('button')).toHaveTextContent('Aberta')

    rerender(<StatusButton aberta={false} tamanho="celular" aoAlternar={() => undefined} />)
    expect(screen.getByRole('button')).toHaveTextContent('Fechada')
  })

  it('ocupado desabilita o botao', () => {
    render(<StatusButton aberta aoAlternar={() => undefined} ocupado />)

    expect(screen.getByRole('button')).toBeDisabled()
  })
})

describe('AvailabilityToggle', () => {
  it('aria-pressed e aria-label seguem o estado', async () => {
    const aoAlternar = vi.fn()
    const { rerender } = render(<AvailabilityToggle nome="Item A" esgotado={false} aoAlternar={aoAlternar} />)

    const botao = screen.getByRole('button', { name: 'Item A: disponível' })
    expect(botao).toHaveAttribute('aria-pressed', 'false')
    expect(botao).toHaveTextContent('Disponível')

    await userEvent.click(botao)
    expect(aoAlternar).toHaveBeenCalledOnce()

    rerender(<AvailabilityToggle nome="Item A" esgotado aoAlternar={aoAlternar} />)
    const esgotado = screen.getByRole('button', { name: 'Item A: esgotado' })
    expect(esgotado).toHaveAttribute('aria-pressed', 'true')
    expect(esgotado).toHaveTextContent('Esgotado')
  })

  it('sem permissao (sem aoAlternar) vira informativo, sem botao', () => {
    render(<AvailabilityToggle nome="Item A" esgotado />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText('Esgotado')).toBeInTheDocument()
  })
})

describe('selos de status', () => {
  it('OrderStatusPill: Gerado vira "Não enviado" e Enviado vira "Enviado"', () => {
    render(
      <>
        <OrderStatusPill status="Gerado" />
        <OrderStatusPill status="Enviado" />
        <OrderStatusPill status="Novo" />
      </>,
    )

    expect(screen.getByText('Não enviado')).toBeInTheDocument()
    expect(screen.getByText('Enviado')).toBeInTheDocument()
    expect(screen.getByText('Novo')).toBeInTheDocument()
  })

  it('selo do cliente: Aberto e Fechado', () => {
    const { rerender } = render(<ClientStatusBadge aberta />)
    expect(screen.getByText('Aberto')).toBeInTheDocument()

    rerender(<ClientStatusBadge aberta={false} />)
    expect(screen.getByText('Fechado')).toBeInTheDocument()
  })
})

describe('IngredientTile', () => {
  it('marcado expoe aria-pressed e alterna ao clicar', async () => {
    function Exemplo() {
      const [marcado, setMarcado] = useState(false)
      return <IngredientTile nome="Item A" categoria="Carne" marcado={marcado} onAlternar={() => setMarcado((m) => !m)} />
    }
    render(<Exemplo />)

    const tile = screen.getByRole('button', { name: 'Item A' })
    expect(tile).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(tile)
    expect(tile).toHaveAttribute('aria-pressed', 'true')
  })

  it('bloqueado fica desabilitado e nao responde', async () => {
    const aoAlternar = vi.fn()
    render(<IngredientTile nome="Item B" categoria="Salada" marcado={false} bloqueado onAlternar={aoAlternar} />)

    const tile = screen.getByRole('button', { name: 'Item B' })
    expect(tile).toBeDisabled()

    await userEvent.click(tile)
    expect(aoAlternar).not.toHaveBeenCalled()
  })

  it('esgotado mostra "(acabou)" no rotulo', () => {
    render(<IngredientTile nome="Item C" categoria="Guarnicao" marcado={false} bloqueado esgotado onAlternar={() => undefined} />)

    expect(screen.getByRole('button', { name: 'Item C (acabou)' })).toBeDisabled()
  })

  it('categoria desconhecida nao quebra', () => {
    render(<IngredientTile nome="Item D" categoria="CategoriaNova" marcado={false} onAlternar={() => undefined} />)

    expect(screen.getByRole('button', { name: 'Item D' })).toBeEnabled()
  })
})

describe('Steppers', () => {
  it('Stepper do produto: minimo 1 (o botao de diminuir fica desabilitado em 1)', async () => {
    const aoMudar = vi.fn()
    render(<Stepper valor={1} aoMudar={aoMudar} rotulo="Quantidade do produto" />)

    expect(screen.getByRole('button', { name: 'Diminuir quantidade' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Aumentar quantidade' }))
    expect(aoMudar).toHaveBeenCalledWith(2)
  })

  it('Stepper do produto: acima do minimo diminui', async () => {
    const aoMudar = vi.fn()
    render(<Stepper valor={3} aoMudar={aoMudar} rotulo="Quantidade do produto" />)

    await userEvent.click(screen.getByRole('button', { name: 'Diminuir quantidade' }))

    expect(aoMudar).toHaveBeenCalledWith(2)
  })

  it('Stepper de linha: chegar a 0 avisa com 0 (quem usa remove o item)', async () => {
    const aoMudar = vi.fn()
    render(<LineStepper valor={1} aoMudar={aoMudar} nomeDoItem="Item A" />)

    await userEvent.click(screen.getByRole('button', { name: 'Diminuir quantidade de Item A' }))

    expect(aoMudar).toHaveBeenCalledWith(0)
  })

  it('Stepper de linha tem nomes acessiveis que dizem de qual item e', () => {
    render(<LineStepper valor={2} aoMudar={() => undefined} nomeDoItem="Item A" tamanho="celular" />)

    expect(screen.getByRole('group', { name: 'Quantidade de Item A' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aumentar quantidade de Item A' })).toBeInTheDocument()
  })
})

describe('navegacao da loja', () => {
  const abas = [
    { id: 'pedidos', rotulo: 'Pedidos' },
    { id: 'hoje', rotulo: 'Hoje' },
    { id: 'cardapio', rotulo: 'Cardápio' },
  ]

  function Exemplo() {
    const [ativa, setAtiva] = useState('pedidos')
    return <Tabs abas={abas} ativa={ativa} aoSelecionar={setAtiva} rotulo="Áreas da loja" />
  }

  it('Tabs: semantica de tablist, tab e aria-selected', () => {
    render(<Exemplo />)

    expect(screen.getByRole('tablist', { name: 'Áreas da loja' })).toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(3)
    expect(screen.getByRole('tab', { name: 'Pedidos' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Hoje' })).toHaveAttribute('aria-selected', 'false')
  })

  it('Tabs: so a aba ativa entra na ordem do Tab (roving tabindex)', () => {
    render(<Exemplo />)

    expect(screen.getByRole('tab', { name: 'Pedidos' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tab', { name: 'Hoje' })).toHaveAttribute('tabindex', '-1')
  })

  it('Tabs: clique troca a aba', async () => {
    render(<Exemplo />)

    await userEvent.click(screen.getByRole('tab', { name: 'Hoje' }))

    expect(screen.getByRole('tab', { name: 'Hoje' })).toHaveAttribute('aria-selected', 'true')
  })

  it('Tabs: setas, Home e End navegam e movem o foco', async () => {
    render(<Exemplo />)
    screen.getByRole('tab', { name: 'Pedidos' }).focus()

    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Hoje' })).toHaveFocus()
    expect(screen.getByRole('tab', { name: 'Hoje' })).toHaveAttribute('aria-selected', 'true')

    await userEvent.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'Cardápio' })).toHaveFocus()

    await userEvent.keyboard('{ArrowRight}') // da a volta
    expect(screen.getByRole('tab', { name: 'Pedidos' })).toHaveFocus()

    await userEvent.keyboard('{ArrowLeft}') // volta para o fim
    expect(screen.getByRole('tab', { name: 'Cardápio' })).toHaveFocus()

    await userEvent.keyboard('{Home}')
    expect(screen.getByRole('tab', { name: 'Pedidos' })).toHaveFocus()
  })

  it('Tabs: cada aba aponta para o seu painel (aria-controls)', () => {
    render(<Exemplo />)

    expect(screen.getByRole('tab', { name: 'Cardápio' })).toHaveAttribute('aria-controls', 'painel-cardapio')
  })

  it('BottomTabBar: UMA coluna por aba permitida (de 1 a 5)', () => {
    const { container, rerender } = render(<BottomTabBar abas={abas} ativa="hoje" aoSelecionar={() => undefined} rotulo="Áreas da loja" />)
    const nav = container.querySelector('nav') as HTMLElement

    expect(nav.style.gridTemplateColumns).toMatch(/^repeat\(3, minmax\(0(px)?, 1fr\)\)$/)
    expect(screen.getByRole('button', { name: 'Hoje' })).toHaveAttribute('aria-current', 'page')

    rerender(<BottomTabBar abas={abas.slice(0, 1)} ativa="pedidos" aoSelecionar={() => undefined} rotulo="Áreas da loja" />)
    expect((container.querySelector('nav') as HTMLElement).style.gridTemplateColumns).toMatch(/^repeat\(1, minmax\(0(px)?, 1fr\)\)$/)
  })

  it('BottomTabBar: clique seleciona', async () => {
    const aoSelecionar = vi.fn()
    render(<BottomTabBar abas={abas} ativa="pedidos" aoSelecionar={aoSelecionar} rotulo="Áreas da loja" />)

    await userEvent.click(screen.getByRole('button', { name: 'Cardápio' }))

    expect(aoSelecionar).toHaveBeenCalledWith('cardapio')
  })
})
