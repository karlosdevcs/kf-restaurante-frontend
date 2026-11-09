import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { definirDesktop, removerMatchMedia } from '../../test/matchMedia'
import { Button, Dialog } from '.'

function Exemplo({ aoConfirmar = () => undefined }: { aoConfirmar?: () => void }) {
  const [aberto, setAberto] = useState(false)

  return (
    <>
      <Button onClick={() => setAberto(true)}>Desativar Ana</Button>
      <Dialog
        aberto={aberto}
        aoFechar={() => setAberto(false)}
        titulo="Desativar Ana?"
        descricao="A pessoa perde o acesso na hora."
        acoes={
          <>
            <Button variante="outline" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button
              variante="primary-brand"
              onClick={() => {
                aoConfirmar()
                setAberto(false)
              }}
            >
              Desativar
            </Button>
          </>
        }
      />
    </>
  )
}

afterEach(() => removerMatchMedia())

describe('Dialog', () => {
  it('fechado nao renderiza nada', () => {
    render(<Exemplo />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('aberto: role=dialog modal, com titulo e descricao ligados', async () => {
    render(<Exemplo />)
    await userEvent.click(screen.getByRole('button', { name: 'Desativar Ana' }))

    const dialogo = screen.getByRole('dialog', { name: 'Desativar Ana?' })

    expect(dialogo).toHaveAttribute('aria-modal', 'true')
    expect(dialogo).toHaveAccessibleDescription('A pessoa perde o acesso na hora.')
  })

  it('ao abrir, o foco vai para dentro do dialogo', async () => {
    render(<Exemplo />)
    await userEvent.click(screen.getByRole('button', { name: 'Desativar Ana' }))

    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus()
  })

  it('prende o foco: Tab no ultimo volta ao primeiro e Shift+Tab no primeiro vai ao ultimo', async () => {
    render(<Exemplo />)
    await userEvent.click(screen.getByRole('button', { name: 'Desativar Ana' }))

    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus()

    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Desativar' })).toHaveFocus()

    await userEvent.tab() // ultimo -> primeiro, sem sair do dialogo
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus()

    await userEvent.tab({ shift: true }) // primeiro -> ultimo
    expect(screen.getByRole('button', { name: 'Desativar' })).toHaveFocus()
  })

  it('Esc fecha e devolve o foco ao botao que abriu', async () => {
    render(<Exemplo />)
    const abridor = screen.getByRole('button', { name: 'Desativar Ana' })
    await userEvent.click(abridor)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(abridor).toHaveFocus()
  })

  it('cancelar tambem devolve o foco ao botao que abriu', async () => {
    render(<Exemplo />)
    const abridor = screen.getByRole('button', { name: 'Desativar Ana' })
    await userEvent.click(abridor)

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(abridor).toHaveFocus()
  })

  it('a acao de confirmar roda uma vez e fecha', async () => {
    const aoConfirmar = vi.fn()
    render(<Exemplo aoConfirmar={aoConfirmar} />)
    await userEvent.click(screen.getByRole('button', { name: 'Desativar Ana' }))

    await userEvent.click(screen.getByRole('button', { name: 'Desativar' }))

    expect(aoConfirmar).toHaveBeenCalledOnce()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('no computador e uma janela centralizada; no celular ancora no rodape (folha)', async () => {
    definirDesktop(true)
    const { unmount } = render(<Exemplo />)
    await userEvent.click(screen.getByRole('button', { name: 'Desativar Ana' }))
    expect(screen.getByRole('dialog').className).toContain('rounded-dialogo')
    unmount()

    definirDesktop(false)
    render(<Exemplo />)
    await userEvent.click(screen.getByRole('button', { name: 'Desativar Ana' }))
    expect(screen.getByRole('dialog').className).toContain('rounded-t-dialogo')
  })
})
