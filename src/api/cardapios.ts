import { ehApiError, requisitar } from './client'
import type { AlterarOpcoesDoCardapioRequest, Cardapio, CriarCardapioRequest } from './tipos'

// ABERTO. A API devolve 404 quando nao ha cardapio hoje OU quando ele ainda e rascunho: para o cliente, as
// duas coisas sao "ainda nao publicado". Aqui o 404 vira `null`; os demais erros continuam erros.
export async function buscarCardapioHoje(sinal?: AbortSignal): Promise<Cardapio | null> {
  try {
    return await requisitar<Cardapio>('/cardapios/hoje', { sinal })
  } catch (erro) {
    if (ehApiError(erro) && erro.status === 404) return null
    throw erro
  }
}

// GerenciarCardapio: o cardapio de hoje em QUALQUER situacao, inclusive rascunho. 404 = ainda nao existe (vira `null`).
export async function buscarCardapioDoPainel(sinal?: AbortSignal): Promise<Cardapio | null> {
  try {
    return await requisitar<Cardapio>('/cardapios/hoje/painel', { autenticada: true, sinal })
  } catch (erro) {
    if (ehApiError(erro) && erro.status === 404) return null
    throw erro
  }
}

// GerenciarCardapio: troca as opcoes de um cardapio em RASCUNHO (depois de publicado a API recusa com 400)
export function alterarOpcoesDoCardapio(id: number, dados: AlterarOpcoesDoCardapioRequest): Promise<Cardapio> {
  return requisitar<Cardapio>(`/cardapios/${id}/opcoes`, { metodo: 'PUT', corpo: dados, autenticada: true })
}

// GerenciarCardapio: le qualquer cardapio por id, inclusive rascunho (e o unico jeito de reencontrar um rascunho)
export function buscarCardapio(id: number, sinal?: AbortSignal): Promise<Cardapio> {
  return requisitar<Cardapio>(`/cardapios/${id}`, { autenticada: true, sinal })
}

// GerenciarCardapio: cria como rascunho. 409 se ja existe cardapio hoje.
export function criarCardapio(dados: CriarCardapioRequest): Promise<Cardapio> {
  return requisitar<Cardapio>('/cardapios', { metodo: 'POST', corpo: dados, autenticada: true })
}

// GerenciarCardapio: publicar tambem REABRE um cardapio fechado
export function publicarCardapio(id: number): Promise<Cardapio> {
  return requisitar<Cardapio>(`/cardapios/${id}/publicar`, { metodo: 'POST', autenticada: true })
}

// GerenciarCardapio
export function fecharCardapio(id: number): Promise<Cardapio> {
  return requisitar<Cardapio>(`/cardapios/${id}/fechar`, { metodo: 'POST', autenticada: true })
}
