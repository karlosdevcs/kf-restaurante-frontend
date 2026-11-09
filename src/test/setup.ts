import '@testing-library/jest-dom/vitest'
import { configure } from '@testing-library/react'
import { servidor } from './servidor'

// o primeiro teste de cada arquivo carrega o bloco da loja sob demanda (import dinamico): com varios arquivos em paralelo,
// 1 s (o padrao) as vezes nao basta. Teste que espera algo que NAO deve aparecer continua falhando rapido pelo `queryBy`.
configure({ asyncUtilTimeout: 3000 })

// chamada sem handler e erro: um teste nunca bate numa API de verdade por acidente
beforeAll(() => servidor.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  servidor.resetHandlers()
  sessionStorage.clear()
})
afterAll(() => servidor.close())
