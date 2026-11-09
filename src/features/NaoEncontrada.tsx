import { Link } from 'react-router-dom'
import { useTituloDaPagina } from '../lib/useTituloDaPagina'

// rota `*`: pagina simples com link para a home (spec, seção 7)
export function NaoEncontrada() {
  useTituloDaPagina('Página não encontrada')

  return (
    <main className="mx-auto flex min-h-screen max-w-[480px] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-[24px] leading-[1.2] font-extrabold">Página não encontrada</h1>
      <p className="text-muted">O endereço que você abriu não existe.</p>
      <Link to="/" className="text-brand-strong font-bold underline">
        Voltar para o cardápio
      </Link>
    </main>
  )
}
