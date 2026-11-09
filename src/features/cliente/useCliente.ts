import { useContext } from 'react'
import { ClienteContext, type ValorDoCliente } from './ClienteContext'

export function useCliente(): ValorDoCliente {
  const valor = useContext(ClienteContext)
  if (!valor) throw new Error('useCliente precisa estar dentro do ClienteProvider')
  return valor
}
