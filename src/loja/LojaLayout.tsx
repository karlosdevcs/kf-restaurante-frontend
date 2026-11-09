import { Link, NavLink, Outlet } from 'react-router-dom'
import { Logo } from '../components/Logo'

const ABAS = [
  { para: '/loja', rotulo: 'Pedidos', exata: true },
  { para: '/loja/hoje', rotulo: 'Hoje', exata: false },
  { para: '/loja/cardapio', rotulo: 'Cardápio', exata: false },
  { para: '/loja/cadastros', rotulo: 'Cadastros', exata: false },
]

// Um unico <nav>: tab bar fixa no rodape (mobile) que vira abas horizontais no topo (desktop).
function NavegacaoLoja() {
  return (
    <nav
      aria-label="Áreas da loja"
      className="fixed inset-x-0 bottom-0 z-10 flex border-t border-borda-leve bg-white md:static md:border-0 md:bg-transparent md:px-6"
    >
      {ABAS.map((aba) => (
        <NavLink
          key={aba.para}
          to={aba.para}
          end={aba.exata}
          className={({ isActive }) =>
            'flex-1 py-3.5 text-center text-sm font-bold transition-colors md:flex-none md:px-5 md:py-3 ' +
            (isActive
              ? 'text-brand md:border-b-2 md:border-brand'
              : 'text-texto-terciario hover:text-texto-principal md:border-b-2 md:border-transparent')
          }
        >
          {aba.rotulo}
        </NavLink>
      ))}
    </nav>
  )
}

export function LojaLayout() {
  return (
    <div className="min-h-full bg-white md:bg-loja-bg md:p-6">
      <div className="mx-auto min-h-full max-w-6xl bg-white pb-20 md:min-h-0 md:rounded-xl md:pb-0 md:shadow-sm">
        <header className="flex items-center justify-between px-4 pt-4 md:px-6 md:pt-5">
          <Logo />
          <Link to="/" className="text-sm font-semibold text-texto-terciario hover:text-texto-principal">
            Ver site do cliente
          </Link>
        </header>

        <NavegacaoLoja />

        <main className="px-4 py-5 md:border-t md:border-borda-leve md:px-6 md:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
