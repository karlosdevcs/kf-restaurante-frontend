import { useCallback, useEffect, useState } from 'react'
import { alterarOpcao, criarOpcao, listarOpcoes, listarTamanhos } from '../api'
import { Carregando, BotaoPrincipal, BotaoSecundario, ErroInline } from '../components/Feedback'
import { Pill } from '../components/Pill'
import { CATEGORIAS_AVULSO, NOME_CATEGORIA } from '../types/api'
import type { Categoria, Opcao, TamanhoMarmita } from '../types/api'
import { formatarMoeda, mensagemDeErro } from '../utils/formatar'

const TODAS_CATEGORIAS: Categoria[] = ['Carne', 'Acompanhamento', 'Guarnicao', 'Salada', 'Bebida', 'Sobremesa']
const campo = 'w-full rounded-sm border border-borda-media bg-white px-4 py-3 text-base outline-none focus:border-texto-principal'

// ---------- formulario unico para criar e editar ----------

interface FormProps {
  inicial?: Opcao
  onSalvar: (dados: { nome: string; categoria: Categoria; preco: number | null }) => Promise<void>
  onCancelar?: () => void
}

function OpcaoForm({ inicial, onSalvar, onCancelar }: FormProps) {
  const editando = inicial !== undefined
  const [nome, setNome] = useState(inicial?.nome ?? '')
  const [categoria, setCategoria] = useState<Categoria>(inicial?.categoria ?? 'Carne')
  const [preco, setPreco] = useState(inicial?.preco !== null && inicial?.preco !== undefined ? String(inicial.preco) : '')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const avulsa = CATEGORIAS_AVULSO.includes(categoria)
  // na criacao so Bebida/Sobremesa pedem preco; na edicao qualquer opcao pode ganhar preco (vira vendida avulsa)
  const mostrarPreco = avulsa || editando
  const precoNumero = preco.trim() === '' ? null : Number(preco.replace(',', '.'))
  const precoInvalido = precoNumero !== null && (Number.isNaN(precoNumero) || precoNumero < 0)
  const faltaPreco = avulsa && precoNumero === null

  async function enviar() {
    setErro(null)
    setSalvando(true)
    try {
      await onSalvar({ nome: nome.trim(), categoria, preco: mostrarPreco ? precoNumero : null })
      if (!editando) {
        setNome('')
        setPreco('')
      }
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form
      className="space-y-4 rounded-lg border border-borda-leve p-4"
      onSubmit={(e) => {
        e.preventDefault()
        void enviar()
      }}
    >
      <input className={campo} placeholder="Nome (ex.: Feijoada)" value={nome} onChange={(e) => setNome(e.target.value)} />
      <div className="flex flex-wrap gap-2">
        {TODAS_CATEGORIAS.map((c) => (
          <Pill key={c} ativo={categoria === c} onClick={() => setCategoria(c)}>
            {NOME_CATEGORIA[c]}
          </Pill>
        ))}
      </div>
      {mostrarPreco && (
        <input
          className={campo}
          inputMode="decimal"
          placeholder={avulsa ? 'Preço (obrigatório)' : 'Preço (deixe vazio se só entra em marmita)'}
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
        />
      )}
      <ErroInline mensagem={erro} />
      <div className="flex gap-2">
        <BotaoPrincipal tipo="submit" larguraTotal={false} desabilitado={nome.trim() === '' || precoInvalido || faltaPreco || salvando}>
          {salvando ? 'Salvando...' : editando ? 'Salvar' : 'Cadastrar opção'}
        </BotaoPrincipal>
        {onCancelar && <BotaoSecundario onClick={onCancelar}>Cancelar</BotaoSecundario>}
      </div>
    </form>
  )
}

// ---------- sub-aba Opcoes ----------

function OpcoesSubTab() {
  const [opcoes, setOpcoes] = useState<Opcao[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [editando, setEditando] = useState<number | null>(null)

  const carregar = useCallback(async () => {
    try {
      setOpcoes(await listarOpcoes())
      setErro(null)
    } catch (e) {
      setErro(mensagemDeErro(e))
    }
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar])

  if (!opcoes && !erro) return <Carregando />

  return (
    <div className="space-y-6">
      <OpcaoForm
        onSalvar={async (dados) => {
          await criarOpcao(dados)
          await carregar()
        }}
      />

      <ErroInline mensagem={erro} />

      <ul className="divide-y divide-borda-leve">
        {(opcoes ?? []).map((o) =>
          editando === o.id ? (
            <li key={o.id} className="py-3">
              <OpcaoForm
                inicial={o}
                onCancelar={() => setEditando(null)}
                onSalvar={async (dados) => {
                  await alterarOpcao(o.id, dados)
                  setEditando(null)
                  await carregar()
                }}
              />
            </li>
          ) : (
            <li key={o.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{o.nome}</p>
                <p className="text-xs text-texto-terciario">{NOME_CATEGORIA[o.categoria]}</p>
              </div>
              <span className="text-sm font-semibold text-texto-secundario">{o.preco !== null ? formatarMoeda(o.preco) : 'Componente'}</span>
              <button type="button" onClick={() => setEditando(o.id)} className="text-sm font-semibold text-texto-secundario hover:text-texto-principal">
                Editar
              </button>
            </li>
          ),
        )}
      </ul>
    </div>
  )
}

// ---------- sub-aba Tamanhos (somente leitura nesta versao) ----------

function TamanhosSubTab() {
  const [tamanhos, setTamanhos] = useState<TamanhoMarmita[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    listarTamanhos().then(setTamanhos).catch((e) => setErro(mensagemDeErro(e)))
  }, [])

  if (!tamanhos && !erro) return <Carregando />

  return (
    <div className="space-y-4">
      <ErroInline mensagem={erro} />
      <p className="text-sm text-texto-secundario">Somente leitura por enquanto. Para alterar tamanhos, use a API.</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(tamanhos ?? []).map((t) => (
          <div key={t.id} className="rounded-lg border border-borda-leve p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold">{t.nome}</span>
              <span className="font-bold text-brand">{formatarMoeda(t.preco)}</span>
            </div>
            <p className="mt-1 text-sm text-texto-secundario">Até {t.limitedeComponente} itens</p>
            {t.limites.length > 0 && (
              <p className="mt-1 text-xs text-texto-terciario">{t.limites.map((l) => `${l.maximo} ${NOME_CATEGORIA[l.categoria].toLowerCase()}`).join(' · ')}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function CadastrosTab() {
  const [sub, setSub] = useState<'opcoes' | 'tamanhos'>('opcoes')

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <Pill ativo={sub === 'opcoes'} onClick={() => setSub('opcoes')}>
          Opções
        </Pill>
        <Pill ativo={sub === 'tamanhos'} onClick={() => setSub('tamanhos')}>
          Tamanhos
        </Pill>
      </div>
      {sub === 'opcoes' ? <OpcoesSubTab /> : <TamanhosSubTab />}
    </div>
  )
}
