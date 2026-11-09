import { useState } from 'react'
import { ChoiceButton } from '../../../components/ui'
import { useIsDesktop } from '../../../lib/useIsDesktop'
import { OpcoesSecao } from './OpcoesSecao'
import { TamanhosSecao } from './TamanhosSecao'

// Aba Cadastros (GerenciarCadastros, spec 11.4). Computador: Opcoes (flex 2, minimo 440) e Tamanhos (flex 1, minimo 260)
// lado a lado. Celular: duas ChoiceButton alternam entre as subabas.
export function CadastrosPage() {
  const desktop = useIsDesktop()
  const [subaba, setSubaba] = useState<'opcoes' | 'tamanhos'>('opcoes')

  if (desktop) {
    return (
      <div className="flex flex-wrap items-start gap-6">
        <div className="min-w-[440px] flex-[2]">
          <OpcoesSecao />
        </div>
        <div className="min-w-[260px] flex-1">
          <TamanhosSecao />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="Cadastros" className="grid grid-cols-2 gap-2">
        <ChoiceButton ativo={subaba === 'opcoes'} altura={40} raio="loja" onClick={() => setSubaba('opcoes')}>
          Opções
        </ChoiceButton>
        <ChoiceButton ativo={subaba === 'tamanhos'} altura={40} raio="loja" onClick={() => setSubaba('tamanhos')}>
          Tamanhos
        </ChoiceButton>
      </div>
      {subaba === 'opcoes' ? <OpcoesSecao /> : <TamanhosSecao />}
    </div>
  )
}
