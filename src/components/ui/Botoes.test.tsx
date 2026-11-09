import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Button, ChoiceButton, FilterPill, LinkButton, SizeButton, SizeCard } from '.'

describe('Button', () => {
  it('chama onClick', async () => {
    const aoClicar = vi.fn()
    render(<Button onClick={aoClicar}>Salvar</Button>)

    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(aoClicar).toHaveBeenCalledOnce()
  })

  it('ocupado: mostra o rotulo de andamento, fica desabilitado e nao dispara o clique', async () => {
    const aoClicar = vi.fn()
    render(
      <Button ocupado rotuloOcupado="Salvando..." onClick={aoClicar}>
        Salvar
      </Button>,
    )

    const botao = screen.getByRole('button', { name: 'Salvando...' })

    expect(botao).toBeDisabled()
    expect(botao).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(botao)
    expect(aoClicar).not.toHaveBeenCalled()
  })

  it('ocupado sem rotulo de andamento mantem o texto', () => {
    render(<Button ocupado>Salvar</Button>)

    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled()
  })

  it('por padrao nao e submit (nao envia formulario sem querer)', () => {
    render(<Button>Qualquer</Button>)

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('submit quando pedido', () => {
    render(<Button type="submit">Entrar</Button>)

    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('desabilitado nao dispara o clique', async () => {
    const aoClicar = vi.fn()
    render(
      <Button disabled onClick={aoClicar}>
        Finalizar pedido
      </Button>,
    )

    await userEvent.click(screen.getByRole('button'))

    expect(aoClicar).not.toHaveBeenCalled()
  })
})

describe('LinkButton', () => {
  it('e um link de verdade (href real), para o navegador nao bloquear a abertura', () => {
    render(
      <LinkButton href="https://wa.me/5531999999999?text=oi" target="_blank" rel="noopener noreferrer">
        Enviar no WhatsApp
      </LinkButton>,
    )

    const link = screen.getByRole('link', { name: 'Enviar no WhatsApp' })

    expect(link).toHaveAttribute('href', 'https://wa.me/5531999999999?text=oi')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('dispara o onClick (o aviso de "enviado") sem impedir o link', async () => {
    const aoClicar = vi.fn((e: React.MouseEvent) => e.preventDefault()) // jsdom nao navega; so conferimos que nao foi bloqueado por nos
    render(
      <LinkButton href="https://wa.me/1" onClick={aoClicar}>
        Enviar
      </LinkButton>,
    )

    await userEvent.click(screen.getByRole('link'))

    expect(aoClicar).toHaveBeenCalledOnce()
  })
})

describe('FilterPill, SizeButton e ChoiceButton', () => {
  it('FilterPill expoe aria-pressed', () => {
    const { rerender } = render(<FilterPill ativa={false}>Categoria</FilterPill>)
    expect(screen.getByRole('button', { name: 'Categoria' })).toHaveAttribute('aria-pressed', 'false')

    rerender(<FilterPill ativa>Categoria</FilterPill>)
    expect(screen.getByRole('button', { name: 'Categoria' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('SizeButton expoe aria-pressed e responde ao clique', async () => {
    const aoClicar = vi.fn()
    render(
      <SizeButton ativo onClick={aoClicar}>
        M
      </SizeButton>,
    )

    const botao = screen.getByRole('button', { name: 'M' })
    expect(botao).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(botao)
    expect(aoClicar).toHaveBeenCalledOnce()
  })

  it('ChoiceButton expoe aria-pressed', () => {
    render(<ChoiceButton ativo={false}>Retirada</ChoiceButton>)

    expect(screen.getByRole('button', { name: 'Retirada' })).toHaveAttribute('aria-pressed', 'false')
  })
})

describe('SizeCard', () => {
  it('e um link para a montagem, com singular e plural de itens e preco em reais', () => {
    render(
      <MemoryRouter>
        <SizeCard nome="M" itens={3} preco={20} para="/montar/2" />
        <SizeCard nome="P" itens={1} preco={15} para="/montar/1" />
      </MemoryRouter>,
    )

    const grande = screen.getByRole('link', { name: /M.*3 itens/ })
    expect(grande).toHaveAttribute('href', '/montar/2')
    expect(grande.textContent?.replace(/ /g, ' ')).toContain('R$ 20,00')
    expect(screen.getByRole('link', { name: /P.*1 item(?!s)/ })).toHaveAttribute('href', '/montar/1')
  })
})
