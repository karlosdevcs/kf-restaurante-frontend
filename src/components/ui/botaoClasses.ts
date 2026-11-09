import { cx } from '../../lib/cx'

// Classes do botao (spec, seção 8). Ficam fora do arquivo do componente para ele exportar so componentes.

export type VarianteDeBotao = 'primary-ink' | 'primary-brand' | 'outline-brand' | 'outline' | 'ghost-back' | 'whatsapp'

// 52 CTA de rodape / "Confirmar pedido" / "Entrar"; 48 adicionar (desktop); 46 formularios e acoes de cartao;
// 44 escolhas e acoes pequenas no celular; 40 pilulas e filtros; 36 e 34 toggles de disponibilidade
export type AlturaDeBotao = 52 | 48 | 46 | 44 | 40 | 36 | 34

// pilula (padrao); confirmar = 14 (so "Confirmar pedido" no desktop); escolha = 12; tamanho = 10
export type RaioDeBotao = 'pilula' | 'confirmar' | 'escolha' | 'tamanho'

const ALTURA: Record<AlturaDeBotao, string> = {
  52: 'h-[52px]',
  48: 'h-[48px]',
  46: 'h-[46px]',
  44: 'h-[44px]',
  40: 'h-[40px]',
  36: 'h-[36px]',
  34: 'h-[34px]',
}

const RAIO: Record<RaioDeBotao, string> = {
  pilula: 'rounded-pilula',
  confirmar: 'rounded-tile', // 14px
  escolha: 'rounded-escolha', // 12px
  tamanho: 'rounded-tamanho', // 10px
}

const VARIANTE: Record<VarianteDeBotao, string> = {
  'primary-ink': 'border-transparent bg-ink text-white hover:bg-ink-hover',
  'primary-brand': 'border-transparent bg-brand text-white hover:bg-brand-hover',
  'outline-brand': 'border-brand bg-white text-brand hover:bg-surface',
  outline: 'border-line bg-white text-ink hover:bg-surface',
  'ghost-back': 'border-transparent bg-transparent text-[14px] font-semibold text-muted hover:text-ink',
  whatsapp: 'border-transparent bg-success-text text-white hover:bg-success',
}

const DESABILITADO: Record<VarianteDeBotao, string> = {
  'primary-ink': 'disabled:border-disabled-bg disabled:bg-disabled-bg disabled:text-disabled-fg',
  'primary-brand': 'disabled:border-disabled-bg disabled:bg-disabled-bg disabled:text-disabled-fg',
  'outline-brand': 'disabled:border-disabled-bg disabled:bg-disabled-bg disabled:text-disabled-fg',
  outline: 'disabled:border-disabled-bg disabled:bg-disabled-bg disabled:text-disabled-fg',
  'ghost-back': 'disabled:text-disabled-fg',
  whatsapp: 'disabled:border-disabled-bg disabled:bg-disabled-bg disabled:text-disabled-fg',
}

interface OpcoesDeBotao {
  variante: VarianteDeBotao
  altura: AlturaDeBotao
  raio: RaioDeBotao
  larguraTotal: boolean
  className?: string
}

export function botaoClasses({ variante, altura, raio, larguraTotal, className }: OpcoesDeBotao): string {
  const ghost = variante === 'ghost-back'

  return cx(
    'relative inline-flex items-center justify-center gap-2 border text-[15px] font-bold whitespace-nowrap transition-colors',
    ALTURA[ghost ? 44 : altura],
    ghost ? 'justify-start' : RAIO[raio],
    ghost ? 'px-1' : 'px-5',
    larguraTotal && 'w-full',
    VARIANTE[variante],
    DESABILITADO[variante],
    // controles visualmente menores que 44px ganham area de toque de 44 sem mudar o desenho
    !ghost && altura < 44 && 'toque-v',
    className,
  )
}

// valor da variavel --h usada por .toque-v
export function estiloDeToque(altura: AlturaDeBotao): Record<string, string> | undefined {
  return altura < 44 ? { '--h': `${altura}px` } : undefined
}
