import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BottomTabBar, Banner, Logo, Tabs } from '../../components/ui'
import { idDaAba, idDoPainel } from '../../lib/abas'
import { abasPermitidas } from '../../lib/permissoes'
import { useIsDesktop } from '../../lib/useIsDesktop'
import { useSessao } from '../auth/useSessao'
import { UserMenu } from './UserMenu'

// Casca da area da loja (spec, parte 5): cabecalho (Logo + UserMenu; o StatusButton chega na fase 6), abas das permissoes
// da pessoa e o conteudo. Mensagem de 403 aparece no topo da area de conteudo e nunca derruba a sessao.
export function LojaLayout() {
  const { usuario, avisoProibido, dispensarAviso } = useSessao()
  const desktop = useIsDesktop()
  const local = useLocation()
  const navegar = useNavigate()

  if (!usuario) return null

  const abas = abasPermitidas(usuario)
  const ativa = abas.find((aba) => local.pathname === aba.caminho || local.pathname.startsWith(`${aba.caminho}/`))
  const itens = abas.map(({ id, rotulo }) => ({ id, rotulo }))
  const irPara = (id: string) => {
    const destino = abas.find((aba) => aba.id === id)
    if (destino) navegar(destino.caminho)
  }

  const corpo = (
    <main
      id={ativa ? idDoPainel(ativa.id) : undefined}
      role={ativa ? 'tabpanel' : undefined}
      aria-labelledby={ativa ? idDaAba(ativa.id) : undefined}
      className="mx-auto w-full max-w-[1240px] flex-1 p-4 lg:p-6"
    >
      {avisoProibido ? (
        <div className="mb-4 flex items-start justify-between gap-3">
          <Banner tipo="erro" className="flex-1">
            {avisoProibido}
          </Banner>
          <button type="button" onClick={dispensarAviso} className="toque-v h-9 px-3 text-[13px] font-semibold text-muted hover:text-ink" style={{ '--h': '36px' } as React.CSSProperties}>
            Fechar
          </button>
        </div>
      ) : null}
      <Outlet />
    </main>
  )

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="border-b border-line-soft bg-white">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-4 lg:px-6">
          <Logo tamanho={desktop ? 'desktop' : 'celular'} contexto="loja" comPainel />
          <UserMenu />
        </div>
        {desktop && itens.length > 0 ? (
          <div className="mx-auto max-w-[1240px] px-2">
            <Tabs abas={itens} ativa={ativa?.id ?? ''} aoSelecionar={irPara} rotulo="Áreas da loja" />
          </div>
        ) : null}
      </header>
      {corpo}
      {!desktop && itens.length > 0 ? (
        <div className="sticky bottom-0">
          <BottomTabBar abas={itens} ativa={ativa?.id ?? ''} aoSelecionar={irPara} rotulo="Áreas da loja" />
        </div>
      ) : null}
    </div>
  )
}
