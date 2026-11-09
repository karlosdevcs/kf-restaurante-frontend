import { useId, useState, type FormEvent } from 'react'
import { ehApiError } from '../../../api/client'
import type { Opcao } from '../../../api/tipos'
import { Banner, Button, ChoiceButton, Field, ListCheckbox } from '../../../components/ui'
import {
  categoriaExigePreco,
  categoriasDoFormulario,
  formularioDaOpcao,
  OPCAO_EM_BRANCO,
  opcaoTemPreco,
  ordenarOpcoes,
  payloadDaOpcao,
  validarOpcao,
  type FormularioDeOpcao,
} from '../../../lib/cadastros'
import { categoriaInfo } from '../../../lib/categoriaConfig'
import { cx } from '../../../lib/cx'
import { formatBRL } from '../../../lib/formatar'
import { useIsDesktop } from '../../../lib/useIsDesktop'
import { CartaoDeErroDeCarga, Esqueleto } from '../../cliente/Estados'
import { useOpcoesCadastradas, useSalvarOpcao } from './useCadastros'

// Subaba "Opcoes" da aba Cadastros (spec, 11.4): lista e formulario de criar e editar.
export function OpcoesSecao() {
  const desktop = useIsDesktop()
  const opcoes = useOpcoesCadastradas()
  // `null` = formulario fechado; `'nova'` = criando; uma opcao = editando
  const [editando, setEditando] = useState<Opcao | 'nova' | null>(null)

  const lista = ordenarOpcoes(opcoes.data ?? [])

  return (
    <section aria-label="Opções" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className={cx('font-extrabold', desktop ? 'text-[24px]' : 'text-[20px]')}>Opções</h2>
        <Button variante="primary-ink" altura={40} className="px-4" onClick={() => setEditando('nova')}>
          Nova opção
        </Button>
      </div>

      {editando !== null ? (
        // `key` reinicia o formulario ao trocar de opcao
        <FormularioDeOpcaoCartao key={editando === 'nova' ? 'nova' : editando.id} opcao={editando === 'nova' ? null : editando} aoFechar={() => setEditando(null)} />
      ) : null}

      {opcoes.isPending ? (
        <div role="status" aria-busy="true" aria-label="Carregando as opções" className="flex flex-col gap-2">
          <Esqueleto className="h-12" />
          <Esqueleto className="h-12" />
        </div>
      ) : null}
      {opcoes.isError && opcoes.data === undefined ? <CartaoDeErroDeCarga aoTentarDeNovo={() => void opcoes.refetch()} /> : null}
      {opcoes.data && lista.length === 0 ? <p className="text-[14px] text-muted">Nenhuma opção cadastrada ainda.</p> : null}

      {lista.length > 0 ? (desktop ? <TabelaDeOpcoes opcoes={lista} aoEditar={setEditando} /> : <LinhasDeOpcoes opcoes={lista} aoEditar={setEditando} />) : null}
    </section>
  )
}

function PrecoDaOpcao({ opcao }: { opcao: Opcao }) {
  return opcao.preco === null ? <span className="text-muted">componente</span> : <span className="font-bold text-brand">{formatBRL(opcao.preco)}</span>
}

function BotaoEditar({ nome, aoClicar }: { nome: string; aoClicar: () => void }) {
  return (
    <Button variante="outline" altura={36} className="px-3 text-[13px]" onClick={aoClicar} aria-label={`Editar ${nome}`}>
      Editar
    </Button>
  )
}

function TabelaDeOpcoes({ opcoes, aoEditar }: { opcoes: Opcao[]; aoEditar: (opcao: Opcao) => void }) {
  const cabecalho = 'px-4 py-3 text-left text-[12px] font-normal tracking-[0.5px] text-muted uppercase'

  return (
    <div className="overflow-x-auto rounded-cartao border border-line-soft bg-white">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-line-soft">
            <th scope="col" className={cabecalho}>
              Nome
            </th>
            <th scope="col" className={cabecalho}>
              Categoria
            </th>
            <th scope="col" className={cabecalho}>
              Preço
            </th>
            <th scope="col" className={cabecalho}>
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {opcoes.map((opcao) => (
            <tr key={opcao.id} className="border-b border-line-row last:border-b-0">
              <td className="px-4 py-[10px] font-semibold">{opcao.nome}</td>
              <td className="px-4 py-[10px] text-[14px] text-muted">{categoriaInfo(opcao.categoria).rotulo}</td>
              <td className="px-4 py-[10px] text-[14px]">
                <PrecoDaOpcao opcao={opcao} />
              </td>
              <td className="px-4 py-[10px]">
                <BotaoEditar nome={opcao.nome} aoClicar={() => aoEditar(opcao)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LinhasDeOpcoes({ opcoes, aoEditar }: { opcoes: Opcao[]; aoEditar: (opcao: Opcao) => void }) {
  return (
    <ul>
      {opcoes.map((opcao) => (
        <li key={opcao.id} className="flex items-center gap-3 border-b border-line-row py-2">
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold">{opcao.nome}</p>
            <p className="text-[12px] text-muted">{categoriaInfo(opcao.categoria).rotulo}</p>
          </div>
          <span className="text-[13px]">
            <PrecoDaOpcao opcao={opcao} />
          </span>
          <BotaoEditar nome={opcao.nome} aoClicar={() => aoEditar(opcao)} />
        </li>
      ))}
    </ul>
  )
}

// Formulario de criar e editar (cartao com borda brand, raio 14)
function FormularioDeOpcaoCartao({ opcao, aoFechar }: { opcao: Opcao | null; aoFechar: () => void }) {
  const desktop = useIsDesktop()
  const [formulario, setFormulario] = useState<FormularioDeOpcao>(opcao ? formularioDaOpcao(opcao) : OPCAO_EM_BRANCO)
  const salvar = useSalvarOpcao()
  const idCategoria = useId()

  const atualizar = (parcial: Partial<FormularioDeOpcao>) => {
    salvar.reset()
    setFormulario((atual) => ({ ...atual, ...parcial }))
  }

  const erros = validarOpcao(formulario)
  const valido = Object.keys(erros).length === 0
  const componente = !categoriaExigePreco(formulario.categoria)

  // 409: nome ja existe, mostrado abaixo do campo Nome. 400 e demais erros: Banner.
  const erroDaApi = salvar.isError ? salvar.error : null
  const erroNoNome = erroDaApi && ehApiError(erroDaApi) && erroDaApi.status === 409 ? erroDaApi.message : null
  const erroNoBanner = erroDaApi && !erroNoNome ? erroDaApi.message : null

  function aoEnviar(evento: FormEvent) {
    evento.preventDefault()
    if (!valido) return
    salvar.mutate({ id: opcao?.id ?? null, dados: payloadDaOpcao(formulario) }, { onSuccess: aoFechar })
  }

  return (
    <form onSubmit={aoEnviar} noValidate aria-label={opcao ? `Editar ${opcao.nome}` : 'Nova opção'} className="flex flex-col gap-2 rounded-tile border border-brand bg-white px-4 py-[14px]">
      <Field
        rotulo="Nome"
        variante="loja"
        autoFocus
        placeholder="Nome, ex.: Strogonoff"
        value={formulario.nome}
        onChange={(e) => atualizar({ nome: e.target.value })}
        erro={erroNoNome}
      />

      <div role="group" aria-labelledby={idCategoria} className="flex flex-col gap-[6px]">
        <span id={idCategoria} className="text-[14px] font-bold">
          Categoria
        </span>
        <div
          className={cx('grid gap-2', !desktop && 'grid-cols-3')}
          style={desktop ? { gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))' } : undefined}
        >
          {categoriasDoFormulario(formulario.categoria).map((categoria) => (
            <ChoiceButton
              key={categoria}
              ativo={formulario.categoria === categoria}
              altura={40}
              raio="loja"
              texto="categoria"
              onClick={() => atualizar({ categoria })}
            >
              {desktop ? categoriaInfo(categoria).rotulo : categoriaInfo(categoria).rotuloCurto}
            </ChoiceButton>
          ))}
        </div>
      </div>

      {componente ? (
        <div className="flex flex-col gap-1">
          <ListCheckbox marcado={formulario.vendeAvulsa} onAlternar={() => atualizar({ vendeAvulsa: !formulario.vendeAvulsa })}>
            Vender também avulsa
          </ListCheckbox>
          {!formulario.vendeAvulsa ? <p className="text-[12px] text-muted">Componente de marmita não tem preço próprio. Entra no preço do tamanho.</p> : null}
        </div>
      ) : null}

      {opcaoTemPreco(formulario) ? (
        <Field
          rotulo="Preço"
          variante="loja"
          inputMode="decimal"
          placeholder="0,00"
          value={formulario.preco}
          onChange={(e) => atualizar({ preco: e.target.value })}
          erro={formulario.preco.trim() !== '' ? (erros.preco ?? null) : null}
        />
      ) : null}

      {erroNoBanner ? <Banner tipo="erro">{erroNoBanner}</Banner> : null}

      <div className="flex justify-end gap-2 pt-1">
        <Button variante="outline" altura={44} onClick={aoFechar}>
          Cancelar
        </Button>
        <Button type="submit" variante="primary-ink" altura={44} disabled={!valido} ocupado={salvar.isPending} rotuloOcupado="Salvando...">
          Salvar opção
        </Button>
      </div>
    </form>
  )
}
