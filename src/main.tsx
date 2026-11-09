import '@fontsource-variable/inter' // Inter auto-hospedada: sem Google Fonts em producao
import './index.css'

import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { criarQueryClient } from './api/queryClient'
import { criarRoteador } from './routes'

const queryClient = criarQueryClient()
const roteador = criarRoteador()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={roteador} />
    </QueryClientProvider>
  </StrictMode>,
)
