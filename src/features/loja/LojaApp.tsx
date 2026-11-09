import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthProvider'
import { EntrarPage } from '../auth/EntrarPage'
import { RequerAba, RequerSessao } from '../auth/Guardas'
import { ContaPage } from './ContaPage'
import { CadastrosPage } from './cadastros/CadastrosPage'
import { CardapioPage } from './cardapio/CardapioPage'
import { HojePage } from './hoje/HojePage'
import { IndiceDaLoja } from './IndiceDaLoja'
import { PedidosPage } from './pedidos/PedidosPage'
import { UsuariosPage } from './usuarios/UsuariosPage'

// Todo o `/loja/*` e carregado sob demanda (code splitting): o cliente nao baixa o painel nem a logica de login.
// O AuthProvider vive aqui dentro, so para a loja. As abas de cada area ficam em pastas proprias (pedidos, hoje, cardapio, cadastros, usuarios).
export function LojaApp() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="entrar" element={<EntrarPage />} />
        <Route element={<RequerSessao />}>
          <Route index element={<IndiceDaLoja />} />
          <Route
            path="pedidos"
            element={
              <RequerAba aba="pedidos">
                <PedidosPage />
              </RequerAba>
            }
          />
          <Route
            path="hoje"
            element={
              <RequerAba aba="hoje">
                <HojePage />
              </RequerAba>
            }
          />
          <Route
            path="cardapio"
            element={
              <RequerAba aba="cardapio">
                <CardapioPage />
              </RequerAba>
            }
          />
          <Route
            path="cadastros"
            element={
              <RequerAba aba="cadastros">
                <CadastrosPage />
              </RequerAba>
            }
          />
          <Route
            path="usuarios"
            element={
              <RequerAba aba="usuarios">
                <UsuariosPage />
              </RequerAba>
            }
          />
          <Route path="conta" element={<ContaPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
