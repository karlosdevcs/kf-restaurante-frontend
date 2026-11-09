import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { trocarSenha } from '../../api/auth'
import { Banner, Button, Chip, PasswordField } from '../../components/ui'
import { rotuloDaPermissao, rotuloDoPapel } from '../../lib/permissoes'
import { useSessao } from '../auth/useSessao'

// Minha conta (spec, 11.6): dados da pessoa (somente leitura) e troca da propria senha.
export function ContaPage() {
  const { usuario } = useSessao()
  const [atual, setAtual] = useState('')
  const [nova, setNova] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [tentou, setTentou] = useState(false)

  const troca = useMutation({
    mutationFn: () => trocarSenha({ senhaAtual: atual, novaSenha: nova }),
    onSuccess: () => {
      setAtual('')
      setNova('')
      setConfirmacao('')
      setTentou(false)
    },
  })

  if (!usuario) return null

  const erroDaAtual = tentou && atual === '' ? 'Informe a senha atual.' : null
  const erroDaNova = tentou && (nova.length < 8 || nova.length > 128) ? 'A nova senha deve ter de 8 a 128 caracteres.' : null
  const erroDaConfirmacao = tentou && !erroDaNova && confirmacao !== nova ? 'A confirmação precisa ser igual à nova senha.' : null

  function aoEnviar(evento: FormEvent) {
    evento.preventDefault()
    setTentou(true)
    troca.reset()
    if (atual === '' || nova.length < 8 || nova.length > 128 || confirmacao !== nova) return
    troca.mutate()
  }

  return (
    <div className="mx-auto flex max-w-[560px] flex-col gap-4">
      <h1 className="text-[24px] font-extrabold">Minha conta</h1>

      <section aria-label="Seus dados" className="flex flex-col gap-3 rounded-cartao border border-line-soft bg-white p-5">
        <div>
          <p className="text-[16px] font-bold">{usuario.nome}</p>
          <p className="text-[14px] text-muted">{usuario.email}</p>
        </div>
        <div>
          <Chip variante={usuario.papel === 'Superuser' ? 'superuser' : 'papel'}>{rotuloDoPapel(usuario.papel)}</Chip>
        </div>
        {usuario.permissoes.length > 0 ? (
          <ul aria-label="Suas permissões" className="flex flex-wrap gap-2">
            {usuario.permissoes.map((permissao) => (
              <li key={permissao}>
                <Chip>{rotuloDaPermissao(permissao)}</Chip>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <form onSubmit={aoEnviar} noValidate className="flex flex-col gap-4 rounded-cartao border border-line-soft bg-white p-5">
        <h2 className="text-[18px] font-extrabold">Trocar senha</h2>

        {troca.isSuccess ? <Banner tipo="sucesso">Senha alterada.</Banner> : null}
        {troca.isError ? <Banner tipo="erro">{troca.error.message}</Banner> : null}

        <PasswordField
          rotulo="Senha atual"
          variante="loja"
          value={atual}
          onChange={(e) => setAtual(e.target.value)}
          erro={erroDaAtual}
          ajuda="Errar a senha atual 5 vezes bloqueia a conta por 15 minutos."
        />
        <PasswordField rotulo="Nova senha" variante="loja" senhaNova value={nova} onChange={(e) => setNova(e.target.value)} erro={erroDaNova} />
        <PasswordField
          rotulo="Confirmar nova senha"
          variante="loja"
          senhaNova
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
          erro={erroDaConfirmacao}
        />

        <div>
          <Button type="submit" variante="primary-ink" ocupado={troca.isPending} rotuloOcupado="Salvando...">
            Trocar senha
          </Button>
        </div>
      </form>
    </div>
  )
}
