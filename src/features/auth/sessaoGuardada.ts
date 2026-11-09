import { lerUtc } from '../../lib/formatar'

// Sessao no sessionStorage (spec, 10.2): sobrevive a recarregar a pagina e morre ao fechar a aba.
// NUNCA em localStorage: o token e um segredo acessivel por JavaScript e ficaria la por muito tempo.
// O token jamais vai para URL, log ou mensagem de erro.

const CHAVE = 'kf:sessao'

export interface SessaoGuardada {
  token: string
  /** UTC, como a API devolve */
  expiraEm: string
}

export function expirou(sessao: SessaoGuardada, agora = Date.now()): boolean {
  const fim = lerUtc(sessao.expiraEm).getTime()
  return Number.isNaN(fim) || fim <= agora
}

export function gravarSessao(sessao: SessaoGuardada): void {
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify(sessao))
  } catch {
    // navegador sem armazenamento: a sessao vale so em memoria
  }
}

export function limparSessaoGuardada(): void {
  try {
    sessionStorage.removeItem(CHAVE)
  } catch {
    // nada a limpar
  }
}

// devolve a sessao guardada se existir, estiver inteira e nao tiver vencido; senao limpa e devolve null
export function lerSessaoGuardada(): SessaoGuardada | null {
  try {
    const texto = sessionStorage.getItem(CHAVE)
    if (!texto) return null

    const dados: unknown = JSON.parse(texto)
    if (dados && typeof dados === 'object' && 'token' in dados && 'expiraEm' in dados) {
      const { token, expiraEm } = dados as Record<string, unknown>
      if (typeof token === 'string' && token !== '' && typeof expiraEm === 'string') {
        const sessao = { token, expiraEm }
        if (!expirou(sessao)) return sessao
      }
    }
  } catch {
    // JSON quebrado ou sessionStorage indisponivel: trata como sem sessao
  }

  limparSessaoGuardada()
  return null
}
