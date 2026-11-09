import { useCallback, useEffect, useState } from 'react'
import { ApiError, buscarCardapioHoje, criarCardapioHoje, fecharCardapio, listarOpcoes, publicarCardapio } from '../api'
import { CategoriaIcone } from '../components/CategoriaIcone'
import { BotaoPrincipal, BotaoSecundario, Carregando, ErroInline } from '../components/Feedback'
import { NOME_CATEGORIA } from '../types/api'
import type { CardapioDoDia, Categoria, Opcao, SituacaoCardapio } from '../types/api'
import { formatarData, mensagemDeErro } from '../utils/formatar'

const ORDEM_CATEGORIAS: Categoria[] = ['Carne', 'Acompanhamento', 'Guarnicao', 'Salada', 'Bebida', 'Sobremesa']

const ROTULO_SITUACAO: Record<SituacaoCardapio, { texto: string; classe: string }> = {
  Rascunho: { texto: 'Rascunho', classe: 'bg-borda-leve text-texto-secundario' },
  Publicado: { texto: 'Publicado', classe: 'bg-sucesso-bg text-sucesso' },
  Fechado: { texto: 'Fechado', classe: 'bg-brand/10 text-brand' },
}

export function CardapioTab() {
  const [cardapio, setCardapio] = useState<CardapioDoDia | null>(null)
  const [opcoes, setOpcoes] = useState<Opcao[]>([])
  const [selecionadas, setSelecionadas] = useState<Set<number>>(new Set())
  const [carregando, setCarregando] = useState(true)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    try {
      const [c, todas] = await Promise.all([buscarCardapioHoje(), listarOpcoes()])
      setCardapio(c)
      setOpcoes(todas)
      setErro(null)
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar])

  async function executar(acao: () => Promise<CardapioDoDia>) {
    setErro(null)
    setOcupado(true)
    try {
      setCardapio(await acao())
    } catch (e) {
      // 409 = ja existe cardapio hoje. Se estiver em rascunho, GET /cardapios/hoje nao o devolve (so publicado/fechado)
      const dica = e instanceof ApiError && e.status === 409 ? ' Se ele estiver em rascunho, ainda não dá para abri-lo por aqui.' : ''
      setErro(mensagemDeErro(e) + dica)
    } finally {
      setOcupado(false)
    }
  }

  const alternar = (id: number) =>
    setSelecionadas((atual) => {
      const proximo = new Set(atual)
      if (proximo.has(id)) proximo.delete(id)
      else proximo.add(id)
      return proximo
    })

  // cria e ja publica: evita deixar o cardapio em rascunho, que a tela nao consegue reencontrar depois
  async function criar(publicar: boolean) {
    await executar(async () => {
      const criado = await criarCardapioHoje([...selecionadas])
      return publicar ? await publicarCardapio(criado.id) : criado
    })
  }

  if (carregando) return <Carregando />

  // ---------- ja existe cardapio hoje: so a situacao muda (a composicao nao e editavel pela API) ----------
  if (cardapio) {
    const rotulo = ROTULO_SITUACAO[cardapio.situacao]
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-texto-terciario">Cardápio de {formatarData(cardapio.dataPublicacao)}</p>
            <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-bold ${rotulo.classe}`}>{rotulo.texto}</span>
          </div>

          {cardapio.situacao === 'Publicado' && (
            <BotaoSecundario onClick={() => void executar(() => fecharCardapio(cardapio.id))} desabilitado={ocupado}>
              Encerrar vendas de hoje
            </BotaoSecundario>
          )}
          {cardapio.situacao === 'Fechado' && (
            <BotaoSecundario onClick={() => void executar(() => publicarCardapio(cardapio.id))} desabilitado={ocupado}>
              Reabrir vendas
            </BotaoSecundario>
          )}
          {cardapio.situacao === 'Rascunho' && (
            <BotaoSecundario onClick={() => void executar(() => publicarCardapio(cardapio.id))} desabilitado={ocupado}>
              Publicar
            </BotaoSecundario>
          )}
        </div>

        <ErroInline mensagem={erro} />

        <ul className="divide-y divide-borda-leve">
          {cardapio.opcoes.map((o) => (
            <li key={o.id} className="flex items-center gap-3 py-3">
              <CategoriaIcone categoria={o.categoria} nome={o.nome} tamanho="sm" />
              <span className="font-semibold">{o.nome}</span>
              <span className="text-xs text-texto-terciario">{NOME_CATEGORIA[o.categoria]}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-texto-terciario">A lista de opções do dia não pode ser alterada depois de criada. Para esgotar um item, use a aba Hoje.</p>
      </div>
    )
  }

  // ---------- ainda nao ha cardapio publicado hoje: monta um ----------
  const grupos = ORDEM_CATEGORIAS.map((categoria) => ({ categoria, itens: opcoes.filter((o) => o.categoria === categoria) })).filter((g) => g.itens.length > 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold">Montar o cardápio de hoje</h2>
        <p className="text-sm text-texto-secundario">Marque o que vai ter hoje. Depois de criado, a lista não muda.</p>
      </div>

      {opcoes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-borda-media p-6 text-center text-texto-secundario">
          Cadastre opções na aba <strong>Cadastros</strong> primeiro.
        </p>
      ) : (
        grupos.map(({ categoria, itens }) => (
          <section key={categoria}>
            <h3 className="mb-2 font-bold">{NOME_CATEGORIA[categoria]}</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {itens.map((o) => {
                const marcado = selecionadas.has(o.id)
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => alternar(o.id)}
                    aria-pressed={marcado}
                    className={'flex items-center gap-3 rounded-md border p-3 text-left transition-colors ' + (marcado ? 'border-texto-principal' : 'border-borda-leve hover:border-borda-media')}
                  >
                    <CategoriaIcone categoria={o.categoria} nome={o.nome} marcado={marcado} tamanho="sm" />
                    <span className="font-semibold">{o.nome}</span>
                  </button>
                )
              })}
            </div>
          </section>
        ))
      )}

      <ErroInline mensagem={erro} />

      <div className="flex flex-wrap gap-3">
        <div className="w-full sm:w-auto">
          <BotaoPrincipal onClick={() => void criar(true)} desabilitado={selecionadas.size === 0 || ocupado} larguraTotal={false}>
            Criar e publicar ({selecionadas.size})
          </BotaoPrincipal>
        </div>
        <BotaoSecundario onClick={() => void criar(false)} desabilitado={selecionadas.size === 0 || ocupado}>
          Salvar como rascunho
        </BotaoSecundario>
      </div>
    </div>
  )
}
