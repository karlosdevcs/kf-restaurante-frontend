import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Banner, Chip, Field, ListCheckbox, PasswordField, TextAreaField } from '.'

describe('Field', () => {
  it('todo campo tem label ligado por htmlFor', () => {
    render(<Field rotulo="Nome" />)

    expect(screen.getByLabelText('Nome')).toBeInTheDocument()
  })

  it('rotulo visualmente oculto continua acessivel pelo label', () => {
    render(<Field rotulo="Buscar" rotuloOculto />)

    expect(screen.getByLabelText('Buscar')).toBeInTheDocument()
  })

  it('erro: aria-invalid, mensagem com role=alert e ligada ao campo por aria-describedby', () => {
    render(<Field rotulo="E-mail" erro="E-mail inválido." />)

    const campo = screen.getByLabelText('E-mail')
    const alerta = screen.getByRole('alert')

    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(alerta).toHaveTextContent('E-mail inválido.')
    expect(campo).toHaveAttribute('aria-describedby', alerta.id)
  })

  it('ajuda aparece quando nao ha erro e e ligada ao campo', () => {
    render(<Field rotulo="Senha" ajuda="Mínimo de 8 caracteres" />)

    const campo = screen.getByLabelText('Senha')

    expect(screen.getByText('Mínimo de 8 caracteres')).toBeInTheDocument()
    expect(campo).toHaveAttribute('aria-describedby')
  })

  it('repassa os atributos do input (telefone: type tel e inputMode tel)', () => {
    render(<Field rotulo="WhatsApp" type="tel" inputMode="tel" />)

    const campo = screen.getByLabelText('WhatsApp')

    expect(campo).toHaveAttribute('type', 'tel')
    expect(campo).toHaveAttribute('inputmode', 'tel')
  })

  it('digitar atualiza o valor', async () => {
    render(<Field rotulo="Nome" />)

    await userEvent.type(screen.getByLabelText('Nome'), 'Ana')

    expect(screen.getByLabelText('Nome')).toHaveValue('Ana')
  })

  it('cada campo tem um id proprio (dois campos nao se confundem)', () => {
    render(
      <>
        <Field rotulo="Primeiro" />
        <Field rotulo="Segundo" />
      </>,
    )

    expect(screen.getByLabelText('Primeiro').id).not.toBe(screen.getByLabelText('Segundo').id)
  })
})

describe('TextAreaField', () => {
  it('tem label e aceita texto', async () => {
    render(<TextAreaField rotulo="Observação" />)

    await userEvent.type(screen.getByLabelText('Observação'), 'sem cebola')

    expect(screen.getByLabelText('Observação')).toHaveValue('sem cebola')
  })
})

describe('PasswordField', () => {
  it('comeca oculta e o botao Mostrar revela; Ocultar esconde de novo', async () => {
    render(<PasswordField rotulo="Senha" />)

    const campo = screen.getByLabelText('Senha')
    expect(campo).toHaveAttribute('type', 'password')

    const mostrar = screen.getByRole('button', { name: 'Mostrar' })
    expect(mostrar).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(mostrar)

    expect(campo).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Ocultar' })).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(screen.getByRole('button', { name: 'Ocultar' }))
    expect(campo).toHaveAttribute('type', 'password')
  })

  it('senha atual usa current-password; senha nova usa new-password', () => {
    const { rerender } = render(<PasswordField rotulo="Senha" />)
    expect(screen.getByLabelText('Senha')).toHaveAttribute('autocomplete', 'current-password')

    rerender(<PasswordField rotulo="Senha" senhaNova />)
    expect(screen.getByLabelText('Senha')).toHaveAttribute('autocomplete', 'new-password')
  })

  it('o botao de mostrar nao envia o formulario', async () => {
    const aoEnviar = vi.fn((e: React.FormEvent) => e.preventDefault())
    render(
      <form onSubmit={aoEnviar}>
        <PasswordField rotulo="Senha" />
      </form>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Mostrar' }))

    expect(aoEnviar).not.toHaveBeenCalled()
  })
})

describe('ListCheckbox', () => {
  it('e um checkbox acessivel com aria-checked', async () => {
    const aoAlternar = vi.fn()
    const { rerender } = render(
      <ListCheckbox marcado={false} onAlternar={aoAlternar}>
        Ver pedidos
      </ListCheckbox>,
    )

    const caixa = screen.getByRole('checkbox', { name: 'Ver pedidos' })
    expect(caixa).toHaveAttribute('aria-checked', 'false')

    await userEvent.click(caixa)
    expect(aoAlternar).toHaveBeenCalledOnce()

    rerender(
      <ListCheckbox marcado onAlternar={aoAlternar}>
        Ver pedidos
      </ListCheckbox>,
    )
    expect(screen.getByRole('checkbox', { name: 'Ver pedidos' })).toHaveAttribute('aria-checked', 'true')
  })

  it('desabilitado nao responde ao clique', async () => {
    const aoAlternar = vi.fn()
    render(
      <ListCheckbox marcado={false} desabilitado onAlternar={aoAlternar}>
        Abrir e fechar a loja
      </ListCheckbox>,
    )

    const caixa = screen.getByRole('checkbox', { name: 'Abrir e fechar a loja' })
    expect(caixa).toBeDisabled()

    await userEvent.click(caixa)
    expect(aoAlternar).not.toHaveBeenCalled()
  })
})

describe('Banner', () => {
  it('erro e anunciado como alert; os demais como status', () => {
    render(
      <>
        <Banner tipo="erro">Falhou</Banner>
        <Banner tipo="sucesso">Deu certo</Banner>
        <Banner tipo="aviso">Atenção</Banner>
        <Banner>Informação</Banner>
      </>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Falhou')
    expect(screen.getAllByRole('status')).toHaveLength(3)
  })
})

describe('Chip', () => {
  it('mostra o texto', () => {
    render(<Chip variante="superuser">Superuser</Chip>)

    expect(screen.getByText('Superuser')).toBeInTheDocument()
  })
})
