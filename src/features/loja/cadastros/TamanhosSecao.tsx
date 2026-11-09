import { useState, type FormEvent } from 'react'
import { ehApiError } from '../../../api/client'
import type { Tamanho } from '../../../api/tipos'
import { Banner, Button, Field, ListCheckbox, Stepper } from '../../../components/ui'
import {
  categoriasComLimite,
  formularioDoTamanho,
  payloadDoTamanho,
  payloadDosLimites,
  TAMANHO_EM_BRANCO,
  textoDoLimite,
  validarTamanho,
  type FormularioDeTamanho,
} from '../../../lib/cadastros'
import { categoriaInfo } from '../../../lib/categoriaConfig'
import { cx } from '../../../lib/cx'
import { formatBRL, pluralizar } from '../../../lib/formatar'
import { useIsDesktop } from '../../../lib/useIsDesktop'
import { CartaoDeErroDeCarga, Esqueleto } from '../../cliente/Estados'
import { useSalvarTamanho, useTamanhosCadastrados } from './useCadastros'

// Subaba "Tamanhos" da aba Cadastros (spec, 11.4): um cartao por tamanho, com preco, limite total e limites por categoria.
export function TamanhosSecao() {
  const desktop = useIsDesktop()
  const tamanhos = useTamanhosCadastrados()
  // `null` = formulario fechado; `'novo'` = criando; um tamanho = editando
  const [editando, setEditando] = useState<Tamanho | 'novo' | null>(null)

  return (
    <section aria-label="Tamanhos" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className={cx('font-extrabold', desktop ? 'text-[24px]' : 'text-[20px]')}>Tamanhos</h2>
        <Button variante="primary-ink" altura={40} className="px-4" onClick={() => setEditando('novo')}>
          Novo tamanho
        </Button>
      </div>

      {editando !== null ? (
        <FormularioDeTamanhoCartao key={editando === 'novo' ? 'novo' : editando.id} tamanho={editando === 'novo' ? null : editando} aoFechar={() => setEditando(null)} />
      ) : null}

      {tamanhos.isPending ? (
        <div role="status" aria-busy="true" aria-label="Carregando os tamanhos" className="flex flex-col gap-2">
          <Esqueleto className="h-20" />
          <Esqueleto className="h-20" />
        </div>
      ) : null}
      {tamanhos.isError && tamanhos.data === undefined ? <CartaoDeErroDeCarga aoTentarDeNovo={() => void tamanhos.refetch()} /> : null}
      {tamanhos.data?.length === 0 ? <p className="text-[14px] text-muted">Nenhum tamanho cadastrado ainda.</p> : null}

      <ul className="flex flex-col gap-[10px]">
        {(tamanhos.data ?? []).map((tamanho) => (
          <li key={tamanho.id} className={cx('flex items-start gap-3 rounded-tile', desktop ? 'border border-line-soft bg-white px-4 py-[14px]' : 'bg-surface p-[14px]')}>
            <div className="min-w-0 flex-1">
              <h3 className="text-[18px] font-extrabold">Marmita {tamanho.nome}</h3>
              <p className="text-[15px] font-bold text-brand">{formatBRL(tamanho.preco)}</p>
              <p className="text-[13px] text-muted">até {pluralizar(tamanho.limitedeComponente, 'item', 'itens')}</p>
              {tamanho.limites.length > 0 ? (
                <ul aria-label={`Limites de Marmita ${tamanho.nome}`} className="mt-1 text-[12px] text-muted">
                  {tamanho.limites.map((limite) => (
                    <li key={limite.categoria}>{textoDoLimite(limite)}</li>
                  ))}
                </ul>
              ) : null}
            </div>
            <Button variante="outline" altura={36} className="px-3 text-[13px]" onClick={() => setEditando(tamanho)} aria-label={`Editar Marmita ${tamanho.nome}`}>
              Editar
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function FormularioDeTamanhoCartao({ tamanho, aoFechar }: { tamanho: Tamanho | null; aoFechar: () => void }) {
  const [formulario, setFormulario] = useState<FormularioDeTamanho>(tamanho ? formularioDoTamanho(tamanho) : TAMANHO_EM_BRANCO)
  const salvar = useSalvarTamanho()

  const atualizar = (parcial: Partial<FormularioDeTamanho>) => {
    salvar.reset()
    setFormulario((atual) => ({ ...atual, ...parcial }))
  }

  const erros = validarTamanho(formulario)
  const valido = Object.keys(erros).length === 0

  // 409: nome duplicado, abaixo do campo Nome. 400 e demais: Banner.
  const erroDaApi = salvar.isError ? salvar.error : null
  const erroNoNome = erroDaApi && ehApiError(erroDaApi) && erroDaApi.status === 409 ? erroDaApi.message : null
  const erroNoBanner = erroDaApi && !erroNoNome ? erroDaApi.message : null

  function limitar(categoria: string, limitada: boolean) {
    const limites = { ...formulario.limites }
    if (limitada) limites[categoria] = limites[categoria] ?? 1
    else delete limites[categoria]
    atualizar({ limites })
  }

  function aoEnviar(evento: FormEvent) {
    evento.preventDefault()
    if (!valido) return
    salvar.mutate({ id: tamanho?.id ?? null, dados: payloadDoTamanho(formulario), limites: payloadDosLimites(formulario.limites).limites }, { onSuccess: aoFechar })
  }

  return (
    <form
      onSubmit={aoEnviar}
      noValidate
      aria-label={tamanho ? `Editar Marmita ${tamanho.nome}` : 'Novo tamanho'}
      className="flex flex-col gap-2 rounded-tile border border-brand bg-white px-4 py-[14px]"
    >
      <Field rotulo="Nome" variante="loja" autoFocus placeholder="Ex.: M" value={formulario.nome} onChange={(e) => atualizar({ nome: e.target.value })} erro={erroNoNome} />
      <Field
        rotulo="Preço"
        variante="loja"
        inputMode="decimal"
        placeholder="0,00"
        value={formulario.preco}
        onChange={(e) => atualizar({ preco: e.target.value })}
        erro={formulario.preco.trim() !== '' ? (erros.preco ?? null) : null}
      />
      <Field
        rotulo="Limite total de componentes"
        variante="loja"
        inputMode="numeric"
        placeholder="Ex.: 3"
        value={formulario.limiteTotal}
        onChange={(e) => atualizar({ limiteTotal: e.target.value })}
        erro={formulario.limiteTotal.trim() !== '' ? (erros.limiteTotal ?? null) : null}
      />

      {tamanho ? (
        <fieldset className="mt-1 flex flex-col gap-1">
          <legend className="text-[14px] font-bold">Limites por categoria</legend>
          <p className="text-[12px] text-muted">Categoria sem limite fica livre, respeitando só o limite total. Porção dupla conta como 2.</p>
          {categoriasComLimite().map((categoria) => {
            const maximo = formulario.limites[categoria]
            const nome = categoriaInfo(categoria).rotulo
            return (
              <div key={categoria} className="flex items-center justify-between gap-3">
                <ListCheckbox marcado={maximo !== undefined} onAlternar={() => limitar(categoria, maximo === undefined)} aria-label={`Limitar ${nome}`} className="flex-1">
                  Limitar {nome}
                </ListCheckbox>
                {maximo !== undefined ? (
                  <Stepper valor={maximo} minimo={0} aoMudar={(novo) => atualizar({ limites: { ...formulario.limites, [categoria]: novo } })} rotulo={`Máximo de ${nome}`} />
                ) : null}
              </div>
            )
          })}
        </fieldset>
      ) : (
        <p className="text-[12px] text-muted">Depois de criar o tamanho, edite-o para definir os limites por categoria.</p>
      )}

      {erroNoBanner ? <Banner tipo="erro">{erroNoBanner}</Banner> : null}

      <div className="flex justify-end gap-2 pt-1">
        <Button variante="outline" altura={44} onClick={aoFechar}>
          Cancelar
        </Button>
        <Button type="submit" variante="primary-ink" altura={44} disabled={!valido} ocupado={salvar.isPending} rotuloOcupado="Salvando...">
          Salvar tamanho
        </Button>
      </div>
    </form>
  )
}
