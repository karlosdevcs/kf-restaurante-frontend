import { useCallback, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Banner, BottomTabBar, Logo, StatusButton, Tabs } from '../../components/ui'
import { idDaAba, idDoPainel } from '../../lib/abas'
import { cx } from '../../lib/cx'
import { abasPermitidas } from '../../lib/permissoes'
import { useIsDesktop } from '../../lib/useIsDesktop'
import { usePermissao, useSessao } from '../auth/useSessao'
import { AvisosContext, useAvisosDaLoja, type AvisosDaLoja } from './AvisosDaLoja'
import { UserMenu } from './UserMenu'
import { useRestauranteDaLoja } from './useRestauranteDaLoja'

// Casca da area da loja (spec, parte 5): cabecalho (Logo + "Painel da loja", StatusButton e UserMenu), abas das
// permissoes da pessoa e o conteudo. Mensagem de erro de mutacao e de 403 aparece no topo do conteudo; 403 nunca derruba a sessao.
export function LojaLayout() {
  const { usuario } = useSessao()
  const [erro, setErro] = useState<string | null>(null)
  const mostrarErro = useCallback((mensagem: string) => setErro(mensagem), [])
  const limparErro = useCallback(() => setErro(null), [])
  const avisos = useMemo<AvisosDaLoja>(() => ({ erro, mostrarErro, limparErro }), [erro, mostrarErro, limparErro])

  if (!usuario) return null

  return (
    <AvisosContext.Provider value={avisos}>
      <CascaDaLoja />
    </AvisosContext.Provider>
  )
}

function CascaDaLoja() {
  const { usuario, avisoProibido, dispensarAviso } = useSessao()
  const { erro, limparErro } = useAvisosDaLoja()
  const desktop = useIsDesktop()
  const local = useLocation()
  const navegar = useNavigate()
  const podeAbrirFechar = usePermissao('AbrirFecharLoja')
  const { restaurante, definirAberta, alternando } = useRestauranteDaLoja()

  if (!usuario) return null

  const abas = abasPermitidas(usuario)
  const ativa = abas.find((aba) => local.pathname === aba.caminho || local.pathname.startsWith(`${aba.caminho}/`))
  const itens = abas.map(({ id, rotulo }) => ({ id, rotulo }))
  const irPara = (id: string) => {
    const destino = abas.find((aba) => aba.id === id)
    if (destino) navegar(destino.caminho)
  }

  const mensagens = [avisoProibido ? { texto: avisoProibido, fechar: dispensarAviso } : null, erro ? { texto: erro, fechar: limparErro } : null].filter(
    (mensagem) => mensagem !== null,
  )

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="border-b border-line-soft bg-white">
        <div className={cx('mx-auto flex max-w-[1240px] items-center justify-between gap-3', desktop ? 'h-16 px-6' : 'h-14 px-[18px]')}>
          <Logo tamanho={desktop ? 'desktop' : 'celular'} contexto="loja" comPainel />
          <div className="flex items-center gap-3">
            {restaurante ? (
              <StatusButton
                aberta={restaurante.aberto}
                tamanho={desktop ? 'web' : 'celular'}
                aoAlternar={podeAbrirFechar ? () => definirAberta(!restaurante.aberto) : undefined}
                ocupado={alternando}
              />
            ) : null}
            <UserMenu />
          </div>
        </div>
        {desktop && itens.length > 0 ? (
          <div className="mx-auto max-w-[1240px] px-2">
            <Tabs abas={itens} ativa={ativa?.id ?? ''} aoSelecionar={irPara} rotulo="Seções da loja" />
          </div>
        ) : null}
      </header>

      <main
        id={ativa ? idDoPainel(ativa.id) : undefined}
        role={ativa ? 'tabpanel' : undefined}
        aria-labelledby={ativa && desktop ? idDaAba(ativa.id) : undefined}
        className={cx('mx-auto w-full max-w-[1240px] flex-1', desktop ? 'p-6' : 'px-[18px] pt-4 pb-[18px]')}
      >
        {mensagens.length > 0 ? (
          <div className="mb-4 flex flex-col gap-2">
            {mensagens.map((mensagem) => (
              <div key={mensagem.texto} className="flex items-start gap-3">
                <Banner tipo="erro" className="flex-1">
                  {mensagem.texto}
                </Banner>
                <button
                  type="button"
                  onClick={mensagem.fechar}
                  className="toque-v relative h-9 px-3 text-[13px] font-semibold text-muted hover:text-ink"
                  style={{ '--h': '36px' } as React.CSSProperties}
                >
                  Fechar
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <Outlet />
      </main>

      {!desktop && itens.length > 0 ? (
        <div className="sticky bottom-0">
          <BottomTabBar abas={itens} ativa={ativa?.id ?? ''} aoSelecionar={irPara} rotulo="Seções da loja" />
        </div>
      ) : null}
    </div>
  )
}
