import { useState } from 'react'
import { criarPedido } from '../api'
import { BotaoPrincipal, ErroInline } from '../components/Feedback'
import { Pill } from '../components/Pill'
import { precoUnitario, useCarrinho } from '../carrinho/useCarrinho'
import { NOME_FORMA_PAGAMENTO } from '../types/api'
import type { CardapioDoDia, FormaDePagamento, Pedido } from '../types/api'
import { formatarMoeda, mensagemDeErro, somenteDigitos } from '../utils/formatar'

interface Props {
  cardapio: CardapioDoDia
  onPedidoCriado: (pedido: Pedido) => void
}

const campo =
  'w-full rounded-sm border border-borda-media bg-white px-4 py-3 text-base outline-none transition-colors focus:border-texto-principal'

export function CarrinhoSection({ cardapio, onPedidoCriado }: Props) {
  const { itens, dados, total, alterarQuantidade, remover, atualizarDados, itensParaApi, limpar } = useCarrinho()
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const telefoneDigitos = somenteDigitos(dados.telefone)
  const entrega = dados.tipoDeEntrega === 'Entrega'
  const dinheiro = dados.formaDePagamento === 'Dinheiro'
  const trocoNumero = dados.trocoPara.trim() === '' ? null : Number(dados.trocoPara.replace(',', '.'))

  // mesmas regras do backend, so para habilitar/desabilitar o botao. A API continua sendo a palavra final.
  const problemas: string[] = []
  if (itens.length === 0) problemas.push('Adicione algo ao pedido')
  if (dados.nome.trim() === '') problemas.push('Informe seu nome')
  if (telefoneDigitos.length < 10 || telefoneDigitos.length > 11) problemas.push('Telefone com DDD (10 ou 11 dígitos)')
  if (entrega && dados.endereco.trim() === '') problemas.push('Informe o endereço de entrega')
  if (dinheiro && trocoNumero !== null && (Number.isNaN(trocoNumero) || trocoNumero < total)) {
    problemas.push(`O troco deve ser de pelo menos ${formatarMoeda(total)}`)
  }

  async function finalizar() {
    setErro(null)
    setEnviando(true)

    try {
      const pedido = await criarPedido({
        nomeCliente: dados.nome.trim(),
        telefone: telefoneDigitos,
        cardapioId: cardapio.id,
        itens: itensParaApi(),
        formaDePagamento: dados.formaDePagamento,
        trocoPara: dinheiro ? trocoNumero : null,
        tipoDeEntrega: dados.tipoDeEntrega,
        endereco: entrega ? dados.endereco.trim() : null,
        referencia: entrega && dados.referencia.trim() !== '' ? dados.referencia.trim() : null,
        observacao: dados.observacao.trim() !== '' ? dados.observacao.trim() : null,
      })

      limpar()
      onPedidoCriado(pedido)
    } catch (e) {
      // mensagem de dominio do backend (ex.: "Feijoada está esgotada.") aparece aqui, perto do botao
      setErro(mensagemDeErro(e))
    } finally {
      setEnviando(false)
    }
  }

  if (itens.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-borda-media p-8 text-center">
        <p className="font-semibold">Seu pedido está vazio</p>
        <p className="mt-1 text-sm text-texto-secundario">Escolha uma marmita ou uma bebida para começar.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-extrabold tracking-tight">Meu pedido</h2>

      <ul className="divide-y divide-borda-leve">
        {itens.map((item) => (
          <li key={item.chave} className="flex items-start gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{item.tipo === 'avulso' ? item.opcao.nome : `Marmita ${item.tamanho.nome}`}</p>
              {item.tipo === 'marmita' && (
                <p className="text-sm text-texto-secundario">{item.componentes.map((c) => c.nome).join(', ')}</p>
              )}
              <p className="mt-1 text-sm font-semibold text-texto-secundario">{formatarMoeda(precoUnitario(item) * item.quantidade)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => alterarQuantidade(item.chave, item.quantidade - 1)} aria-label="Diminuir" className="h-8 w-8 rounded-full border border-borda-media font-bold">
                −
              </button>
              <span className="w-5 text-center font-semibold">{item.quantidade}</span>
              <button type="button" onClick={() => alterarQuantidade(item.chave, item.quantidade + 1)} aria-label="Aumentar" className="h-8 w-8 rounded-full border border-borda-media font-bold">
                +
              </button>
            </div>
            <button type="button" onClick={() => remover(item.chave)} aria-label="Remover item" className="px-1 text-sm text-texto-terciario hover:text-brand">
              ✕
            </button>
          </li>
        ))}
      </ul>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (problemas.length === 0 && !enviando) void finalizar()
        }}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input className={campo} placeholder="Seu nome" value={dados.nome} onChange={(e) => atualizarDados({ nome: e.target.value })} autoComplete="name" />
          <input className={campo} placeholder="WhatsApp com DDD" inputMode="tel" value={dados.telefone} onChange={(e) => atualizarDados({ telefone: e.target.value })} autoComplete="tel" />
        </div>

        <div className="flex gap-2">
          <Pill ativo={!entrega} onClick={() => atualizarDados({ tipoDeEntrega: 'Retirada' })}>
            Retirada
          </Pill>
          <Pill ativo={entrega} onClick={() => atualizarDados({ tipoDeEntrega: 'Entrega' })}>
            Entrega
          </Pill>
        </div>

        {entrega && (
          <div className="space-y-3">
            <input className={campo} placeholder="Endereço (rua, número, bairro)" value={dados.endereco} onChange={(e) => atualizarDados({ endereco: e.target.value })} autoComplete="street-address" />
            <input className={campo} placeholder="Ponto de referência (opcional)" value={dados.referencia} onChange={(e) => atualizarDados({ referencia: e.target.value })} />
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-semibold text-texto-secundario">Forma de pagamento</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(NOME_FORMA_PAGAMENTO) as FormaDePagamento[]).map((forma) => (
              <Pill key={forma} ativo={dados.formaDePagamento === forma} onClick={() => atualizarDados({ formaDePagamento: forma })}>
                {NOME_FORMA_PAGAMENTO[forma]}
              </Pill>
            ))}
          </div>
        </div>

        {dinheiro && (
          <input className={campo} placeholder={`Troco para quanto? (opcional, mín. ${formatarMoeda(total)})`} inputMode="decimal" value={dados.trocoPara} onChange={(e) => atualizarDados({ trocoPara: e.target.value })} />
        )}

        <textarea className={campo} rows={2} placeholder="Observação (ex.: sem cebola)" value={dados.observacao} onChange={(e) => atualizarDados({ observacao: e.target.value })} />

        <div className="flex items-baseline justify-between border-t border-borda-leve pt-4">
          <span className="text-texto-secundario">Total</span>
          <span className="text-2xl font-extrabold">{formatarMoeda(total)}</span>
        </div>

        <ErroInline mensagem={erro} />

        {problemas.length > 0 && <p className="text-sm text-texto-terciario">{problemas[0]}</p>}

        <BotaoPrincipal tipo="submit" desabilitado={problemas.length > 0 || enviando}>
          {enviando ? 'Enviando...' : 'Finalizar pedido'}
        </BotaoPrincipal>
      </form>
    </div>
  )
}
