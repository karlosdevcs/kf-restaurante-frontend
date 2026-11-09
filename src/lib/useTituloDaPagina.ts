import { useEffect } from 'react'

export const NOME_DO_SITE = 'KF Restaurante'

// <title> por rota (spec, 15.9): "KF Restaurante", "Entrar · KF Restaurante", "Painel da loja · KF Restaurante"
export function useTituloDaPagina(titulo?: string) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · ${NOME_DO_SITE}` : NOME_DO_SITE
  }, [titulo])
}
