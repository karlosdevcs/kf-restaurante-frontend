import { useCallback, useEffect, useState } from 'react'
import { abrirRestaurante, alterarEsgotado, alterarWhatsApp, buscarCardapioHoje, buscarRestaurante, fecharRestaurante } from '../api'
import { CategoriaIcone } from '../components/CategoriaIcone'
import { BotaoSecundario, Carregando, ErroInline } from '../components/Feedback'
import { NOME_CATEGORIA } from '../types/api'
import type { CardapioDoDia, Restaurante } from '../types/api'
import { mensagemDeErro } from '../utils/formatar'

const campo = 'w-full rounded-sm border border-borda-media bg-white px-4 py-3 text-base outline-none focus:border-texto-principal'

export function HojeTab() {
  const [restaurante, setRestaurante] = useState<Restaurante | null>(null)
  const [cardapio, setCardapio] = useState<CardapioDoDia | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [erroLoja, setErroLoja] = useState<string | null>(null)
  const [whatsApp, setWhatsApp] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const carregar = useCallback(async () => {
    try {
      const [r, c] = await Promise.all([buscarRestaurante(), buscarCardapioHoje()])
      setRestaurante(r)
      setCardapio(c)
      setWhatsApp(r.whatsApp ?? '')
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

  async function alternarLoja() {
    if (!restaurante) return
    setErroLoja(null)
    setOcupado(true)
    try {
      // abrir sem WhatsApp cadastrado volta 400 com mensagem clara
      setRestaurante(restaurante.aberto ? await fecharRestaurante() : await abrirRestaurante())
    } catch (e) {
      setErroLoja(mensagemDeErro(e))
    } finally {
      setOcupado(false)
    }
  }

  async function salvarWhatsApp() {
    setErroLoja(null)
    setOcupado(true)
    try {
      const r = await alterarWhatsApp(whatsApp)
      setRestaurante(r)
      setWhatsApp(r.whatsApp ?? '')
    } catch (e) {
      setErroLoja(mensagemDeErro(e))
    } finally {
      setOcupado(false)
    }
  }

  async function alternarEsgotado(opcaoId: number, esgotado: boolean) {
    if (!cardapio) return
    setErro(null)
    try {
      const atualizada = await alterarEsgotado(opcaoId, esgotado)
      setCardapio({ ...cardapio, opcoes: cardapio.opcoes.map((o) => (o.id === opcaoId ? atualizada : o)) })
    } catch (e) {
      setErro(mensagemDeErro(e))
    }
  }

  if (carregando) return <Carregando />
  if (!restaurante) return <ErroInline mensagem={erro ?? 'Não foi possível carregar.'} />

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-lg border border-borda-leve p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold">{restaurante.aberto ? 'Loja aberta' : 'Loja fechada'}</h2>
            <p className="text-sm text-texto-secundario">
              {restaurante.aberto ? 'Os clientes podem fazer pedidos.' : 'Os pedidos estão bloqueados.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void alternarLoja()}
            disabled={ocupado}
            className={
              'rounded-full px-5 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-50 ' +
              (restaurante.aberto ? 'bg-texto-principal hover:opacity-90' : 'bg-sucesso hover:opacity-90')
            }
          >
            {restaurante.aberto ? 'Fechar a loja' : 'Abrir a loja'}
          </button>
        </div>

        <div>
          <label htmlFor="whatsapp-loja" className="mb-1 block text-sm font-semibold text-texto-secundario">
            WhatsApp da loja (para onde os pedidos são enviados)
          </label>
          <div className="flex gap-2">
            <input id="whatsapp-loja" className={campo} placeholder="Ex.: 5531999999999" inputMode="tel" value={whatsApp} onChange={(e) => setWhatsApp(e.target.value)} />
            <BotaoSecundario onClick={() => void salvarWhatsApp()} desabilitado={ocupado || whatsApp.trim() === ''}>
              Salvar
            </BotaoSecundario>
          </div>
          <p className="mt-1 text-xs text-texto-terciario">Com código do país e DDD. A loja só abre com o número cadastrado.</p>
        </div>

        <ErroInline mensagem={erroLoja} />
      </section>

      <section>
        <h2 className="mb-1 text-lg font-extrabold">Disponibilidade de hoje</h2>
        <p className="mb-4 text-sm text-texto-secundario">Marque como esgotado o que acabou: some da tela do cliente na hora.</p>
        <ErroInline mensagem={erro} />

        {!cardapio ? (
          <p className="rounded-lg border border-dashed border-borda-media p-6 text-center text-texto-secundario">
            Não há cardápio publicado hoje. Publique um na aba <strong>Cardápio</strong>.
          </p>
        ) : (
          <ul className="divide-y divide-borda-leve">
            {cardapio.opcoes.map((opcao) => (
              <li key={opcao.id} className="flex items-center gap-3 py-3">
                <CategoriaIcone categoria={opcao.categoria} nome={opcao.nome} tamanho="sm" />
                <div className="min-w-0 flex-1">
                  <p className={`font-semibold ${opcao.esgotado ? 'text-texto-terciario line-through' : ''}`}>{opcao.nome}</p>
                  <p className="text-xs text-texto-terciario">{NOME_CATEGORIA[opcao.categoria]}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void alternarEsgotado(opcao.id, !opcao.esgotado)}
                  className={
                    'rounded-full px-4 py-2 text-sm font-bold transition-colors ' +
                    (opcao.esgotado ? 'bg-brand/10 text-brand' : 'bg-sucesso-bg text-sucesso')
                  }
                >
                  {opcao.esgotado ? 'Esgotado' : 'Disponível'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
