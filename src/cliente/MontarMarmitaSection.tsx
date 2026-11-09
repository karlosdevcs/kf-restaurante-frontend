import { useState } from 'react'
import { CategoriaIcone } from '../components/CategoriaIcone'
import { BotaoPrincipal } from '../components/Feedback'
import { useCarrinho } from '../carrinho/useCarrinho'
import { CATEGORIAS_COMPONENTE, NOME_CATEGORIA } from '../types/api'
import type { CardapioDoDia, Categoria, Opcao, TamanhoMarmita } from '../types/api'
import { formatarMoeda } from '../utils/formatar'

interface Props {
  cardapio: CardapioDoDia
  tamanho: TamanhoMarmita
  onVoltar: () => void
  onAdicionada: () => void
}

// Espelha as regras do backend (Marmita.AdicionarOpcao) so para guiar o cliente.
// Quem decide de verdade e a API: se algo passar daqui, o POST /pedidos devolve 400 com a mensagem.
export function MontarMarmitaSection({ cardapio, tamanho, onVoltar, onAdicionada }: Props) {
  const { adicionarMarmita } = useCarrinho()
  const [escolhidos, setEscolhidos] = useState<Opcao[]>([])

  const limiteDe = (categoria: Categoria) => tamanho.limites.find((l) => l.categoria === categoria)?.maximo ?? null
  const quantosDe = (categoria: Categoria) => escolhidos.filter((o) => o.categoria === categoria).length
  const totalCheio = escolhidos.length >= tamanho.limitedeComponente

  const marcado = (opcao: Opcao) => escolhidos.some((o) => o.id === opcao.id)

  function podeMarcar(opcao: Opcao): boolean {
    if (opcao.esgotado || totalCheio) return false
    const limite = limiteDe(opcao.categoria)
    return limite === null || quantosDe(opcao.categoria) < limite
  }

  function alternar(opcao: Opcao) {
    if (marcado(opcao)) {
      setEscolhidos((atuais) => atuais.filter((o) => o.id !== opcao.id))
    } else if (podeMarcar(opcao)) {
      setEscolhidos((atuais) => [...atuais, opcao])
    }
  }

  function adicionar() {
    adicionarMarmita(tamanho, escolhidos)
    onAdicionada()
  }

  const grupos = CATEGORIAS_COMPONENTE.map((categoria) => ({
    categoria,
    opcoes: cardapio.opcoes.filter((o) => o.categoria === categoria),
  })).filter((g) => g.opcoes.length > 0)

  return (
    <div className="space-y-6">
      <header>
        <button type="button" onClick={onVoltar} className="mb-3 text-sm font-semibold text-texto-secundario hover:text-texto-principal">
          ← Voltar ao cardápio
        </button>
        <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Montar marmita {tamanho.nome}</h1>
        <p className="mt-1 text-sm text-texto-secundario">
          {formatarMoeda(tamanho.preco)} · escolha até {tamanho.limitedeComponente} itens
          <span className="ml-2 font-semibold text-texto-principal">
            ({escolhidos.length}/{tamanho.limitedeComponente})
          </span>
        </p>
      </header>

      {grupos.map(({ categoria, opcoes }) => {
        const limite = limiteDe(categoria)
        return (
          <section key={categoria}>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="font-bold">{NOME_CATEGORIA[categoria]}</h2>
              {limite !== null && (
                <span className="text-xs font-semibold text-texto-terciario">
                  {quantosDe(categoria)}/{limite}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {opcoes.map((opcao) => {
                const estaMarcado = marcado(opcao)
                const desabilitado = !estaMarcado && !podeMarcar(opcao)
                return (
                  <button
                    key={opcao.id}
                    type="button"
                    onClick={() => alternar(opcao)}
                    disabled={desabilitado}
                    aria-pressed={estaMarcado}
                    className={
                      'flex items-center gap-3 rounded-md border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ' +
                      (estaMarcado ? 'border-texto-principal bg-white' : 'border-borda-leve bg-white hover:border-borda-media')
                    }
                  >
                    <CategoriaIcone categoria={opcao.categoria} nome={opcao.nome} marcado={estaMarcado} tamanho="sm" />
                    <span className={`font-semibold ${opcao.esgotado ? 'line-through' : ''}`}>{opcao.nome}</span>
                    {opcao.esgotado && <span className="ml-auto text-xs text-texto-terciario">Esgotado</span>}
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}

      <div className="sticky bottom-0 -mx-4 border-t border-borda-leve bg-white px-4 py-4 md:static md:mx-0 md:border-0 md:px-0">
        <BotaoPrincipal onClick={adicionar} desabilitado={escolhidos.length === 0}>
          {escolhidos.length === 0 ? 'Escolha ao menos 1 item' : `Adicionar marmita · ${formatarMoeda(tamanho.preco)}`}
        </BotaoPrincipal>
      </div>
    </div>
  )
}
