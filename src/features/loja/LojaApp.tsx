import { Route, Routes } from 'react-router-dom'
import { Pendente } from '../Pendente'

// FASE 1: bloco da loja vazio. Todo o `/loja/*` e carregado sob demanda (code splitting): o cliente nao baixa
// o painel nem a logica de login. Login e guardas entram na fase 3; abas nas fases 6 a 9.
export function LojaApp() {
  return (
    <Routes>
      <Route path="entrar" element={<Pendente nome="Entrar" />} />
      <Route index element={<Pendente nome="Loja" />} />
      <Route path="pedidos" element={<Pendente nome="Pedidos" />} />
      <Route path="hoje" element={<Pendente nome="Hoje" />} />
      <Route path="cardapio" element={<Pendente nome="Cardápio" />} />
      <Route path="cadastros" element={<Pendente nome="Cadastros" />} />
      <Route path="usuarios" element={<Pendente nome="Usuários" />} />
      <Route path="conta" element={<Pendente nome="Minha conta" />} />
    </Routes>
  )
}
