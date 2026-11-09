import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Banner, Button, Logo } from '../../components/ui'
import { LojaLayout } from '../loja/LojaLayout'
import { abaPorId, primeiraAbaPermitida, type IdDaAba } from '../../lib/permissoes'
import { useSessao } from './useSessao'

// Guarda de TODA rota /loja/* (menos /loja/entrar), spec 10.2:
//   sem sessao -> /loja/entrar (guardando a rota pedida, para voltar depois do login)
//   com sessao -> renderiza so depois do GET /auth/eu; enquanto responde, mostra o esqueleto do cabecalho (sem abas)
export function RequerSessao() {
  const { estado, motivoDoFim, atualizarUsuario, sair } = useSessao()
  const local = useLocation()

  if (estado === 'sem-sessao') {
    // depois de "Sair" ou de expirar a pessoa recomeca do zero; so a visita direta lembra do destino
    const state = motivoDoFim === null ? { de: local.pathname + local.search } : null
    return <Navigate to="/loja/entrar" replace state={state} />
  }

  if (estado === 'carregando') return <EsqueletoDaLoja />

  if (estado === 'erro') {
    return (
      <EsqueletoDaLoja>
        <div className="flex flex-col items-start gap-3">
          <Banner tipo="erro">Não foi possível carregar os seus dados. Tente de novo.</Banner>
          <div className="flex gap-2">
            <Button variante="primary-ink" onClick={atualizarUsuario}>
              Tentar de novo
            </Button>
            <Button variante="outline" onClick={sair}>
              Sair
            </Button>
          </div>
        </div>
      </EsqueletoDaLoja>
    )
  }

  return <LojaLayout />
}

// Esqueleto do cabecalho enquanto o GET /auth/eu responde: sem abas, sem nada que dependa de permissao.
function EsqueletoDaLoja({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="flex h-16 items-center justify-between border-b border-line-soft bg-white px-4 lg:px-6">
        <Logo contexto="loja" comPainel />
        <span aria-hidden="true" className="h-[34px] w-[34px] animate-pulse rounded-full bg-canvas" />
      </header>
      <main className="mx-auto max-w-[1240px] p-4 lg:p-6" aria-busy={children ? undefined : true}>
        {children ?? (
          <p role="status" className="text-[14px] text-muted">
            Carregando...
          </p>
        )}
      </main>
    </div>
  )
}

// Guarda de aba: sem a permissao, vai para a primeira aba permitida (ou para /loja, que mostra "sem acesso").
export function RequerAba({ aba, children }: { aba: IdDaAba; children: ReactNode }) {
  const { usuario } = useSessao()
  if (!usuario) return null

  if (!abaPorId(aba).permitida(usuario)) {
    const primeira = primeiraAbaPermitida(usuario)
    return <Navigate to={primeira ? primeira.caminho : '/loja'} replace />
  }

  return <>{children}</>
}
