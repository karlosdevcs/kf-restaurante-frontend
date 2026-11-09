/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Endereco da API, sem barra no final. Em producao, https (o token viaja no cabecalho). Publico: nunca segredo. */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
