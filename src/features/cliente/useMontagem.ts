import { useCallback, useMemo, useState } from 'react'
import type { Opcao, Tamanho } from '../../api/tipos'
import { ajustarSelecaoAoTamanho, alternarSelecao, tileBloqueado } from '../../lib/regrasMarmita'

// Selecao de ingredientes da marmita em montagem (celular: tela 2; computador: secao de produto). A ordem e a ordem
// em que foram marcados. Um item que ficou esgotado depois de uma atualizacao sai da selecao sozinho.
export function useMontagem(tamanho: Tamanho | undefined, opcoesPorId: ReadonlyMap<number, Opcao>, bloqueioGeral = false) {
  const [marcados, setMarcados] = useState<number[]>([])

  const selecionados = useMemo(
    () =>
      marcados.filter((id) => {
        const opcao = opcoesPorId.get(id)
        return opcao !== undefined && !opcao.esgotado
      }),
    [marcados, opcoesPorId],
  )

  const alternar = useCallback((id: number) => setMarcados((atual) => alternarSelecao(atual, id)), [])
  const limpar = useCallback(() => setMarcados([]), [])

  // aplica a regra da secao 12.2 ao trocar de tamanho com selecao feita
  const trocarTamanho = useCallback((novo: Tamanho) => setMarcados((atual) => ajustarSelecaoAoTamanho(atual, novo, opcoesPorId)), [opcoesPorId])

  const bloqueado = useCallback(
    (opcao: Opcao) => bloqueioGeral || tamanho === undefined || tileBloqueado(opcao, tamanho, selecionados, opcoesPorId),
    [bloqueioGeral, tamanho, selecionados, opcoesPorId],
  )

  return { selecionados, alternar, limpar, trocarTamanho, bloqueado }
}
