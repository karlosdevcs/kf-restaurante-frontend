import { Route, Routes } from 'react-router-dom'
import { ClientePage } from './cliente/ClientePage'
import { CadastrosTab } from './loja/CadastrosTab'
import { CardapioTab } from './loja/CardapioTab'
import { HojeTab } from './loja/HojeTab'
import { LojaLayout } from './loja/LojaLayout'
import { PedidosTab } from './loja/PedidosTab'

// Atencao: a area da loja (/loja) e publica nesta versao, sem login. Ver README.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ClientePage />} />
      <Route path="/loja" element={<LojaLayout />}>
        <Route index element={<PedidosTab />} />
        <Route path="hoje" element={<HojeTab />} />
        <Route path="cardapio" element={<CardapioTab />} />
        <Route path="cadastros" element={<CadastrosTab />} />
      </Route>
      <Route path="*" element={<ClientePage />} />
    </Routes>
  )
}
