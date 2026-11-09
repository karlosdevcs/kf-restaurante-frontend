import type { CSSProperties } from 'react'
import { cx } from '../../lib/cx'

// Botao de abrir e fechar a loja (spec, seção 8). Pedido explicito do usuario: manter este botao COM a bolinha verde.
// Sem a permissao `AbrirFecharLoja` (sem `aoAlternar`) vira o mesmo visual SEM ser botao: um <span> informativo,
// sem hover e sem cursor de clique. O backend e quem decide; aqui so nao oferecemos o que nao vai funcionar.
export function StatusButton({
  aberta,
  aoAlternar,
  ocupado = false,
  tamanho = 'web',
}: {
  aberta: boolean
  /** ausente = sem permissao: renderiza informativo */
  aoAlternar?: () => void
  ocupado?: boolean
  tamanho?: 'web' | 'celular'
}) {
  const web = tamanho === 'web'
  const rotulo = web ? (aberta ? 'Loja aberta' : 'Loja fechada') : aberta ? 'Aberta' : 'Fechada'
  const classes = cx(
    'inline-flex items-center gap-2 rounded-pilula border border-line bg-surface whitespace-nowrap',
    web ? 'h-[40px] px-4 text-[14px] font-bold' : 'h-[34px] px-3 text-[12px] font-bold',
  )
  const bolinha = <span aria-hidden="true" className={cx('shrink-0 rounded-full', web ? 'h-2 w-2' : 'h-[7px] w-[7px]', aberta ? 'bg-success' : 'bg-brand')} />

  if (!aoAlternar) {
    return (
      <span className={classes}>
        {bolinha}
        {rotulo}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={aoAlternar}
      disabled={ocupado}
      aria-label={aberta ? 'Loja aberta. Clicar para fechar' : 'Loja fechada. Clicar para abrir'}
      className={cx(classes, 'toque-v relative transition-colors hover:bg-canvas disabled:opacity-60')}
      style={{ '--h': web ? '40px' : '34px' } as CSSProperties}
    >
      {bolinha}
      {rotulo}
    </button>
  )
}

// Liga e desliga a disponibilidade de uma opcao: "Disponivel" (branco, borda verde) ou "Esgotado" (ink).
// `aria-pressed` e igual a "esgotado". Sem `aoAlternar` (sem permissao `EsgotarOpcoes`), vira informativo.
export function AvailabilityToggle({
  nome,
  esgotado,
  aoAlternar,
  ocupado = false,
  tamanho = 'web',
  altura = 36,
}: {
  nome: string
  esgotado: boolean
  aoAlternar?: () => void
  ocupado?: boolean
  tamanho?: 'web' | 'celular'
  /** 34 no painel lateral do computador; 36 nos demais */
  altura?: 34 | 36
}) {
  const classes = cx(
    'inline-flex items-center justify-center rounded-pilula border px-[10px] text-[13px] font-bold whitespace-nowrap',
    tamanho === 'web' ? 'min-w-[86px]' : 'min-w-[90px]',
    altura === 34 ? 'h-[34px]' : 'h-[36px]',
    esgotado ? 'border-ink bg-ink text-white' : 'border-success-line bg-white text-success-text',
  )
  const texto = esgotado ? 'Esgotado' : 'Disponível'

  if (!aoAlternar) {
    return <span className={classes}>{texto}</span>
  }

  return (
    <button
      type="button"
      onClick={aoAlternar}
      disabled={ocupado}
      aria-pressed={esgotado}
      aria-label={`${nome}: ${esgotado ? 'esgotado' : 'disponível'}`}
      className={cx(classes, 'toque-v relative transition-colors disabled:opacity-60')}
      style={{ '--h': `${altura}px` } as CSSProperties}
    >
      {texto}
    </button>
  )
}
