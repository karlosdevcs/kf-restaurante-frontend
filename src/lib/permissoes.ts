import type { Papel, Permissao, Usuario } from '../api/tipos'

// Rotulos de permissoes e papeis (spec, 10.4). Indexados pelo valor da API; um valor desconhecido
// (permissao nova no backend) aparece com o proprio nome tecnico, sem quebrar a tela.

const ROTULO_DA_PERMISSAO: Record<string, string> = {
  VerPedidos: 'Ver pedidos',
  EsgotarOpcoes: 'Marcar esgotado',
  AbrirFecharLoja: 'Abrir e fechar a loja',
  GerenciarCardapio: 'Montar e publicar o cardápio',
  GerenciarCadastros: 'Gerenciar opções e tamanhos',
  AlterarWhatsApp: 'Alterar o WhatsApp da loja',
}

const ROTULO_DO_PAPEL: Record<string, string> = {
  Funcionario: 'Funcionário',
  Dono: 'Dono',
  Superuser: 'Superuser',
}

export function rotuloDaPermissao(permissao: Permissao): string {
  return ROTULO_DA_PERMISSAO[permissao] ?? permissao
}

export function rotuloDoPapel(papel: Papel): string {
  return ROTULO_DO_PAPEL[papel] ?? papel
}

export function ehGestor(papel: Papel | undefined | null): boolean {
  return papel === 'Dono' || papel === 'Superuser'
}

// ---------- abas da loja (spec, 10.5) ----------

export type IdDaAba = 'pedidos' | 'hoje' | 'cardapio' | 'cadastros' | 'usuarios'

export interface AbaDaLoja {
  id: IdDaAba
  rotulo: string
  caminho: string
  /** `true` quando o usuario pode abrir a aba */
  permitida: (usuario: Pick<Usuario, 'papel' | 'permissoes'>) => boolean
}

const tem = (usuario: Pick<Usuario, 'permissoes'>, permissao: string) => usuario.permissoes.includes(permissao)

// ordem fixa: e a ordem de exibicao e a de "primeira aba permitida"
export const ABAS_DA_LOJA: readonly AbaDaLoja[] = [
  { id: 'pedidos', rotulo: 'Pedidos', caminho: '/loja/pedidos', permitida: (u) => tem(u, 'VerPedidos') },
  {
    id: 'hoje',
    rotulo: 'Hoje',
    caminho: '/loja/hoje',
    permitida: (u) => tem(u, 'AbrirFecharLoja') || tem(u, 'EsgotarOpcoes') || tem(u, 'AlterarWhatsApp'),
  },
  { id: 'cardapio', rotulo: 'Cardápio', caminho: '/loja/cardapio', permitida: (u) => tem(u, 'GerenciarCardapio') },
  { id: 'cadastros', rotulo: 'Cadastros', caminho: '/loja/cadastros', permitida: (u) => tem(u, 'GerenciarCadastros') },
  { id: 'usuarios', rotulo: 'Usuários', caminho: '/loja/usuarios', permitida: (u) => ehGestor(u.papel) },
]

export function abasPermitidas(usuario: Pick<Usuario, 'papel' | 'permissoes'>): AbaDaLoja[] {
  return ABAS_DA_LOJA.filter((aba) => aba.permitida(usuario))
}

export function primeiraAbaPermitida(usuario: Pick<Usuario, 'papel' | 'permissoes'>): AbaDaLoja | null {
  return abasPermitidas(usuario)[0] ?? null
}

export function abaPorId(id: IdDaAba): AbaDaLoja {
  const aba = ABAS_DA_LOJA.find((a) => a.id === id)
  if (!aba) throw new Error(`Aba desconhecida: ${id}`)
  return aba
}
