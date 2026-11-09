import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ehApiError } from '../../api/client'
import { Banner, Button, Field, Logo, PasswordField } from '../../components/ui'
import { cx } from '../../lib/cx'
import { useIsDesktop } from '../../lib/useIsDesktop'
import { useSessao } from './useSessao'

const FORMATO_DE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// so aceita caminho interno da loja: nunca redireciona para endereco de fora
function destinoSeguro(valor: unknown): string {
  return typeof valor === 'string' && valor.startsWith('/loja') && !valor.startsWith('/loja/entrar') ? valor : '/loja'
}

// Tela de login (spec, 10.1). A mensagem de 401 vem da API e e a mesma para qualquer causa: o front nao distingue casos.
export function EntrarPage() {
  const { estado, entrar, motivoDoFim } = useSessao()
  const desktop = useIsDesktop()
  const local = useLocation()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  // erros de preenchimento: so aparecem depois de tentar enviar, e some o do campo que a pessoa volta a editar
  const [validacao, setValidacao] = useState<{ email?: string; senha?: string }>({})
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // sessao valida (login recem-feito ou ja existente): segue para a rota tentada antes ou para a primeira aba permitida
  if (estado !== 'sem-sessao') {
    const de = (local.state as { de?: unknown } | null)?.de
    return <Navigate to={destinoSeguro(de)} replace />
  }

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)

    const problemas: { email?: string; senha?: string } = {}
    if (!FORMATO_DE_EMAIL.test(email.trim())) problemas.email = 'Informe um e-mail válido.'
    if (senha === '') problemas.senha = 'Informe a senha.'
    setValidacao(problemas)
    if (problemas.email || problemas.senha) return

    setEnviando(true)
    try {
      await entrar(email, senha)
    } catch (falha) {
      // 401: a mensagem da API, sem pistas. Qualquer outra falha (rede, 500): texto fixo que nao diz se o e-mail existe.
      setErro(ehApiError(falha) && falha.status === 401 ? falha.message : 'Não foi possível entrar agora. Tente de novo.')
      setSenha('')
      setEnviando(false)
    }
  }

  return (
    <div className={cx('flex min-h-dvh', desktop ? 'items-center justify-center bg-canvas p-6' : 'items-start bg-white px-6 pb-6 pt-12')}>
      <main className={cx('w-full', desktop && 'max-w-[400px] rounded-login bg-white p-8 shadow-cartao')}>
        <form onSubmit={aoEnviar} noValidate className="flex flex-col gap-4">
          <Logo tamanho={desktop ? 'desktop' : 'celular'} contexto="loja" />
          <div>
            <h1 className="text-[24px] font-extrabold">Entrar</h1>
            <p className="text-[14px] text-muted">Área da loja</p>
          </div>

          {motivoDoFim === 'expirou' ? <Banner tipo="aviso">Sua sessão expirou. Entre de novo.</Banner> : null}

          <Field
            rotulo="E-mail"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setValidacao((v) => ({ ...v, email: undefined }))
            }}
            erro={validacao.email}
          />
          <PasswordField
            rotulo="Senha"
            value={senha}
            onChange={(e) => {
              setSenha(e.target.value)
              setValidacao((v) => ({ ...v, senha: undefined }))
            }}
            erro={validacao.senha}
          />

          {erro ? <Banner tipo="erro">{erro}</Banner> : null}

          <Button type="submit" variante="primary-ink" altura={52} larguraTotal ocupado={enviando} rotuloOcupado="Entrando...">
            Entrar
          </Button>
          <p className="text-center text-[13px] text-muted">Esqueceu a senha? Peça ao dono da loja para redefinir.</p>
        </form>
      </main>
    </div>
  )
}
