import { useRef, type KeyboardEvent } from 'react'
import { idDaAba, idDoPainel } from '../../lib/abas'
import { cx } from '../../lib/cx'

export interface ItemDeAba {
  id: string
  rotulo: string
}

// Abas da loja no COMPUTADOR (spec, seção 8): barra branca com borda inferior line-soft; abas min-h44 px16 14/600,
// borda inferior de 2px (brand na ativa). Semantica completa: tablist, tab, e o painel vira tabpanel (ver idDoPainel).
// Setas, Home e End movem entre as abas (padrao ARIA). So recebe as abas PERMITIDAS: quem filtra e a tela.
export function Tabs({ abas, ativa, aoSelecionar, rotulo }: { abas: ItemDeAba[]; ativa: string; aoSelecionar: (id: string) => void; rotulo: string }) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})
  // fora de uma aba (ex.: Minha conta) nenhuma esta ativa: a primeira continua alcancavel pelo Tab
  const haAtiva = abas.some((aba) => aba.id === ativa)

  function aoTeclar(evento: KeyboardEvent<HTMLButtonElement>, indice: number) {
    let destino = -1
    if (evento.key === 'ArrowRight') destino = (indice + 1) % abas.length
    else if (evento.key === 'ArrowLeft') destino = (indice - 1 + abas.length) % abas.length
    else if (evento.key === 'Home') destino = 0
    else if (evento.key === 'End') destino = abas.length - 1
    if (destino < 0) return

    evento.preventDefault()
    const alvo = abas[destino]
    if (!alvo) return
    aoSelecionar(alvo.id)
    refs.current[alvo.id]?.focus()
  }

  return (
    <div role="tablist" aria-label={rotulo} className="flex border-b border-line-soft bg-white">
      {abas.map((aba, indice) => {
        const selecionada = aba.id === ativa
        return (
          <button
            key={aba.id}
            ref={(no) => {
              refs.current[aba.id] = no
            }}
            type="button"
            role="tab"
            id={idDaAba(aba.id)}
            aria-selected={selecionada}
            aria-controls={idDoPainel(aba.id)}
            tabIndex={selecionada || (!haAtiva && indice === 0) ? 0 : -1}
            onClick={() => aoSelecionar(aba.id)}
            onKeyDown={(e) => aoTeclar(e, indice)}
            className={cx(
              'min-h-[44px] border-b-2 bg-transparent px-4 text-[14px] font-semibold transition-colors',
              selecionada ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {aba.rotulo}
          </button>
        )
      })}
    </div>
  )
}

// Barra de abas do CELULAR da loja (spec, seção 8): UMA coluna por aba permitida (de 1 a 5), fundo branco, borda superior
// line-soft; cada aba min-h56 12/700, borda superior de 2px (brand na ativa).
export function BottomTabBar({ abas, ativa, aoSelecionar, rotulo }: { abas: ItemDeAba[]; ativa: string; aoSelecionar: (id: string) => void; rotulo: string }) {
  return (
    <nav aria-label={rotulo} className="grid border-t border-line-soft bg-white" style={{ gridTemplateColumns: `repeat(${Math.max(abas.length, 1)}, minmax(0, 1fr))` }}>
      {abas.map((aba) => {
        const selecionada = aba.id === ativa
        return (
          <button
            key={aba.id}
            type="button"
            aria-current={selecionada ? 'page' : undefined}
            onClick={() => aoSelecionar(aba.id)}
            className={cx('min-h-[56px] border-t-2 text-[12px] font-bold transition-colors', selecionada ? 'border-brand text-brand' : 'border-transparent text-muted')}
          >
            {aba.rotulo}
          </button>
        )
      })}
    </nav>
  )
}
