import { useCallback, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import type { Pedido } from '../../api/tipos'
import { carrinhoReducer } from '../../lib/carrinho'
import { useTituloDaPagina } from '../../lib/useTituloDaPagina'
import { FORMULARIO_INICIAL, type FormularioDoPedido } from '../../lib/pedidoCliente'
import { ClienteContext, type ValorDoCliente } from './ClienteContext'
import { guardarUltimoPedido, lerUltimoPedido, limparUltimoPedido } from './ultimoPedido'

// Carrinho e formulario do cliente: Context + reducer, em memoria (spec, 9.1). Nada disso vai para o localStorage.
export function ClienteProvider({ children }: { children: ReactNode }) {
  const [itens, despachar] = useReducer(carrinhoReducer, [])
  const [formulario, setFormulario] = useState<FormularioDoPedido>(FORMULARIO_INICIAL)
  const [pedidoConfirmado, setPedidoConfirmado] = useState<Pedido | null>(() => lerUltimoPedido())
  const contador = useRef(0)

  const adicionarMarmita = useCallback<ValorDoCliente['adicionarMarmita']>((tamanho, componentesIds, quantidade) => {
    contador.current += 1
    despachar({ tipo: 'adicionar-marmita', chave: `m-${contador.current}`, tamanho, componentesIds, quantidade })
  }, [])

  const adicionarAvulso = useCallback<ValorDoCliente['adicionarAvulso']>((opcao) => despachar({ tipo: 'adicionar-avulso', opcao }), [])
  const mudarQuantidade = useCallback<ValorDoCliente['mudarQuantidade']>(
    (chave, quantidade) => despachar({ tipo: 'mudar-quantidade', chave, quantidade }),
    [],
  )
  const atualizarFormulario = useCallback((parcial: Partial<FormularioDoPedido>) => setFormulario((atual) => ({ ...atual, ...parcial })), [])

  const confirmarPedido = useCallback((pedido: Pedido) => {
    guardarUltimoPedido(pedido)
    setPedidoConfirmado(pedido)
  }, [])

  const recomecar = useCallback(() => {
    limparUltimoPedido()
    setPedidoConfirmado(null)
    despachar({ tipo: 'limpar' })
    // nome, WhatsApp, entrega e pagamento ficam para o proximo pedido; o que era so deste pedido sai
    setFormulario((atual) => ({ ...atual, troco: '', observacao: '' }))
  }, [])

  const valor = useMemo<ValorDoCliente>(
    () => ({ itens, adicionarMarmita, adicionarAvulso, mudarQuantidade, formulario, atualizarFormulario, pedidoConfirmado, confirmarPedido, recomecar }),
    [itens, adicionarMarmita, adicionarAvulso, mudarQuantidade, formulario, atualizarFormulario, pedidoConfirmado, confirmarPedido, recomecar],
  )

  return <ClienteContext.Provider value={valor}>{children}</ClienteContext.Provider>
}

// rota-pai de todas as telas do cliente: o carrinho sobrevive a troca de tela
export function ClienteLayout() {
  useTituloDaPagina()

  return (
    <ClienteProvider>
      <Outlet />
    </ClienteProvider>
  )
}
