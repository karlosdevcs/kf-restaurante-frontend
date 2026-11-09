import { Logo } from '../components/Logo'

interface Props {
  motivo: 'sem-cardapio' | 'loja-fechada' | 'encerrado'
}

const TEXTOS: Record<Props['motivo'], { titulo: string; descricao: string }> = {
  'sem-cardapio': {
    titulo: 'Ainda não publicamos o cardápio de hoje',
    descricao: 'Volte daqui a pouco, ou fale direto com a gente pelo WhatsApp.',
  },
  'loja-fechada': {
    titulo: 'Estamos fechados por enquanto',
    descricao: 'Não estamos recebendo pedidos agora. Volte mais tarde!',
  },
  encerrado: {
    titulo: 'Os pedidos de hoje foram encerrados',
    descricao: 'O cardápio de hoje já fechou. Amanhã tem mais!',
  },
}

export function FechadoHoje({ motivo }: Props) {
  const { titulo, descricao } = TEXTOS[motivo]

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo tamanho={40} />
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{titulo}</h1>
        <p className="mt-2 text-texto-secundario">{descricao}</p>
      </div>
    </div>
  )
}
