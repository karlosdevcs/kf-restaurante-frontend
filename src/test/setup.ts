import '@testing-library/jest-dom/vitest'
import { servidor } from './servidor'

// chamada sem handler e erro: um teste nunca bate numa API de verdade por acidente
beforeAll(() => servidor.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  servidor.resetHandlers()
  sessionStorage.clear()
})
afterAll(() => servidor.close())
