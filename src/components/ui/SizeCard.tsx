import { Link } from 'react-router-dom'
import { formatBRL, pluralizar } from '../../lib/formatar'

interface PropsDoSizeCard {
  /** letra do tamanho ("P", "M", "G") */
  nome: string
  /** limite de componentes do tamanho */
  itens: number
  preco: number
  /** rota de montagem, ex.: `/montar/2` */
  para: string
}

// Cartao de tamanho da tela Cardapio no celular (spec, seção 8): grade de 3 colunas (a grade e de quem usa),
// padding 14 6, raio 16, fundo surface, sem borda. Letra 22/800, "N itens" 11 muted, preco 14/700 brand.
export function SizeCard({ nome, itens, preco, para }: PropsDoSizeCard) {
  return (
    <Link to={para} className="flex flex-col items-center gap-[6px] rounded-cartao bg-surface px-[6px] py-[14px] text-center">
      <span className="text-[22px] leading-none font-extrabold">{nome}</span>
      <span className="text-[11px] text-muted">{pluralizar(itens, 'item', 'itens')}</span>
      <span className="text-[14px] font-bold text-brand">{formatBRL(preco)}</span>
    </Link>
  )
}
