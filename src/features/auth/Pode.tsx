import type { ReactNode } from 'react'
import type { Permissao } from '../../api/tipos'
import { usePermissao } from './useSessao'

// Esconde (nao desabilita) o que a pessoa nao pode usar. A protecao real esta na API; isto e so clareza (spec, 10.4).
export function Pode({ permissao, children }: { permissao: Permissao; children: ReactNode }) {
  return usePermissao(permissao) ? <>{children}</> : null
}
