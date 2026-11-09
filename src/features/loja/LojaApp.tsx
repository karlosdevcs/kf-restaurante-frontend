import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthProvider'
import { EntrarPage } from '../auth/EntrarPage'
import { RequerAba, RequerSessao } from '../auth/Guardas'
import { Pendente } from '../Pendente'
import { ContaPage } from './ContaPage'
import { IndiceDaLoja } from './IndiceDaLoja'

// Todo o `/loja/*` e carregado sob demanda (code splitting): o cliente nao baixa o painel nem a logica de login.
// O AuthProvider vive aqui dentro, so para a loja. As telas das abas entram nas fases 6 a 9.
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
                <Pendente nome="Pedidos" />
              </RequerAba>
            }
          />
          <Route
            path="hoje"
            element={
              <RequerAba aba="hoje">
                <Pendente nome="Hoje" />
              </RequerAba>
            }
          />
          <Route
            path="cardapio"
            element={
              <RequerAba aba="cardapio">
                <Pendente nome="Cardápio" />
              </RequerAba>
            }
          />
          <Route
            path="cadastros"
            element={
              <RequerAba aba="cadastros">
                <Pendente nome="Cadastros" />
              </RequerAba>
            }
          />
          <Route
            path="usuarios"
            element={
              <RequerAba aba="usuarios">
                <Pendente nome="Usuários" />
              </RequerAba>
            }
          />
          <Route path="conta" element={<ContaPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
