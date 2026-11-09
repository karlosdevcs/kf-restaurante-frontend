import { useState } from 'react'
import { CategoriaIcone } from '../components/CategoriaIcone'
import { Pill } from '../components/Pill'
import { useCarrinho } from '../carrinho/useCarrinho'
import { CATEGORIAS_AVULSO, CATEGORIAS_COMPONENTE, NOME_CATEGORIA } from '../types/api'
import type { CardapioDoDia, Categoria, TamanhoMarmita } from '../types/api'
import { formatarData, formatarMoeda } from '../utils/formatar'

interface Props {
  cardapio: CardapioDoDia
  tamanhos: TamanhoMarmita[]
  onEscolherTamanho: (tamanho: TamanhoMarmita) => void
}

function regraDoTamanho(tamanho: TamanhoMarmita): string {
  const partes = [`até ${tamanho.limitedeComponente} itens`]
  for (const limite of tamanho.limites) {
    partes.push(`${limite.maximo} ${NOME_CATEGORIA[limite.categoria].toLowerCase()}`)
  }
  return partes.join(' · ')
}

export function CardapioSection({ cardapio, tamanhos, onEscolherTamanho }: Props) {
  const { adicionarAvulso, itens } = useCarrinho()
  const [filtro, setFiltro] = useState<Categoria | 'Todas'>('Todas')

  const componentes = cardapio.opcoes.filter((o) => CATEGORIAS_COMPONENTE.includes(o.categoria))
  const avulsos = cardapio.opcoes.filter((o) => CATEGORIAS_AVULSO.includes(o.categoria) && o.preco !== null)
  const categoriasPresentes = CATEGORIAS_COMPONENTE.filter((c) => componentes.some((o) => o.categoria === c))
  const componentesFiltrados = filtro === 'Todas' ? componentes : componentes.filter((o) => o.categoria === filtro)

  // tamanho sem preco ou sem espaco para componentes nao da para pedir (ex.: cadastro incompleto)
  const tamanhosValidos = tamanhos.filter((t) => t.preco > 0 && t.limitedeComponente > 0)

  const quantidadeNoCarrinho = (opcaoId: number) =>
    itens.reduce((soma, i) => (i.tipo === 'avulso' && i.opcao.id === opcaoId ? soma + i.quantidade : soma), 0)

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold text-texto-terciario">Cardápio de {formatarData(cardapio.dataPublicacao)}</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">O que tem hoje</h1>
      </header>

      <section>
        <h2 className="mb-3 text-lg font-bold">Escolha o tamanho da marmita</h2>
        {tamanhosValidos.length === 0 ? (
          <p className="text-sm text-texto-secundario">Nenhum tamanho de marmita disponível no momento.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {tamanhosValidos.map((tamanho) => (
              <button
                key={tamanho.id}
                type="button"
                onClick={() => onEscolherTamanho(tamanho)}
                className="group rounded-lg border border-borda-media bg-white p-4 text-left transition-colors hover:border-brand"
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold">{tamanho.nome}</span>
                  <span className="font-bold text-brand">{formatarMoeda(tamanho.preco)}</span>
                </div>
                <p className="mt-1 text-xs text-texto-secundario">{regraDoTamanho(tamanho)}</p>
                <p className="mt-3 text-sm font-semibold text-texto-principal group-hover:text-brand">Montar →</p>
              </button>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Hoje tem</h2>
        {categoriasPresentes.length > 1 && (
          <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
            <Pill ativo={filtro === 'Todas'} onClick={() => setFiltro('Todas')}>
              Todas
            </Pill>
            {categoriasPresentes.map((c) => (
              <Pill key={c} ativo={filtro === c} onClick={() => setFiltro(c)}>
                {NOME_CATEGORIA[c]}
              </Pill>
            ))}
          </div>
        )}
        <ul className="divide-y divide-borda-leve">
          {componentesFiltrados.map((opcao) => (
            <li key={opcao.id} className={`flex items-center gap-3 py-3 ${opcao.esgotado ? 'opacity-50' : ''}`}>
              <CategoriaIcone categoria={opcao.categoria} nome={opcao.nome} tamanho="sm" />
              <div className="min-w-0 flex-1">
                <p className={`font-semibold ${opcao.esgotado ? 'text-texto-terciario line-through' : ''}`}>{opcao.nome}</p>
                <p className="text-xs text-texto-terciario">{NOME_CATEGORIA[opcao.categoria]}</p>
              </div>
              {opcao.esgotado && <span className="text-xs font-semibold text-texto-terciario">Esgotado</span>}
            </li>
          ))}
        </ul>
      </section>

      {avulsos.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">Pra acompanhar</h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {avulsos.map((opcao) => {
              const qtd = quantidadeNoCarrinho(opcao.id)
              return (
                <li key={opcao.id} className={`flex items-center gap-3 rounded-md border border-borda-leve p-3 ${opcao.esgotado ? 'opacity-50' : ''}`}>
                  <CategoriaIcone categoria={opcao.categoria} nome={opcao.nome} tamanho="sm" />
                  <div className="min-w-0 flex-1">
                    <p className={`truncate font-semibold ${opcao.esgotado ? 'line-through' : ''}`}>{opcao.nome}</p>
                    <p className="text-sm text-texto-secundario">{opcao.esgotado ? 'Esgotado' : formatarMoeda(opcao.preco ?? 0)}</p>
                  </div>
                  <button
                    type="button"
                    disabled={opcao.esgotado}
                    onClick={() => adicionarAvulso(opcao)}
                    aria-label={`Adicionar ${opcao.nome}`}
                    className="relative flex h-10 w-10 items-center justify-center rounded-full bg-brand text-xl font-bold text-white transition-colors hover:bg-brand-hover disabled:bg-borda-media"
                  >
                    +
                    {qtd > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-texto-principal px-1 text-[11px]">
                        {qtd}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
