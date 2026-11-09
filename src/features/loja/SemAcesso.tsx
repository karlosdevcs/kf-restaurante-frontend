import { Link } from 'react-router-dom'
import { Button } from '../../components/ui'
import { botaoClasses } from '../../components/ui/botaoClasses'
import { useSessao } from '../auth/useSessao'

// Funcionario sem nenhuma permissao (spec, 10.5). Nao e um erro.
export function SemAcesso() {
  const { sair } = useSessao()

  return (
    <section className="mx-auto mt-6 flex max-w-[480px] flex-col gap-3 rounded-cartao border border-line-soft bg-white p-6">
      <h1 className="text-[20px] font-extrabold">Você ainda não tem acesso a nada por aqui</h1>
      <p className="text-[14px] text-muted">Peça ao dono da loja para liberar as suas permissões.</p>
      <div className="flex gap-2 pt-1">
        <Link
          to="/loja/conta"
          className={botaoClasses({ variante: 'outline', altura: 46, raio: 'pilula', larguraTotal: false })}
        >
          Minha conta
        </Link>
        <Button variante="outline" onClick={sair}>
          Sair
        </Button>
      </div>
    </section>
  )
}
