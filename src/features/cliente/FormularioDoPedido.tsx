import { useId } from 'react'
import { ChoiceButton, Field, TextAreaField } from '../../components/ui'
import type { FormaDePagamento, TipoDeEntrega } from '../../api/tipos'
import { useCliente } from './useCliente'

const ENTREGAS: Array<{ valor: TipoDeEntrega; rotulo: string }> = [
  { valor: 'Retirada', rotulo: 'Retirada' },
  { valor: 'Entrega', rotulo: 'Entrega' },
]

const PAGAMENTOS: Array<{ valor: FormaDePagamento; rotulo: string }> = [
  { valor: 'Pix', rotulo: 'Pix' },
  { valor: 'Dinheiro', rotulo: 'Dinheiro' },
  { valor: 'CartaoDeDebito', rotulo: 'Débito' },
  { valor: 'CartaoDeCredito', rotulo: 'Crédito' },
]

// Formulario de finalizacao (spec, 9.3 tela 3). E o MESMO no celular e no carrinho lateral do computador:
// mesmos campos, mesmos componentes, mesma ordem: Nome, WhatsApp, Como voce recebe (+ Endereco e Referencia),
// Pagamento (+ Troco), Observacao. Le e grava no carrinho do contexto.
export function FormularioDoPedido() {
  const { formulario, atualizarFormulario } = useCliente()
  const idEntrega = useId()
  const idPagamento = useId()
  const entrega = formulario.tipoDeEntrega === 'Entrega'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Field
          rotulo="Nome"
          autoComplete="name"
          value={formulario.nome}
          onChange={(e) => atualizarFormulario({ nome: e.target.value })}
        />
        <Field
          rotulo="WhatsApp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(31) 99999-9999"
          value={formulario.telefone}
          onChange={(e) => atualizarFormulario({ telefone: e.target.value })}
        />
      </div>

      <div role="group" aria-labelledby={idEntrega} className="flex flex-col gap-2">
        <span id={idEntrega} className="text-[13px] font-semibold text-muted">
          Como você recebe
        </span>
        <div className="grid grid-cols-2 gap-2">
          {ENTREGAS.map(({ valor, rotulo }) => (
            <ChoiceButton key={valor} ativo={formulario.tipoDeEntrega === valor} onClick={() => atualizarFormulario({ tipoDeEntrega: valor })}>
              {rotulo}
            </ChoiceButton>
          ))}
        </div>
        {entrega ? (
          <>
            <Field
              rotulo="Endereço"
              rotuloOculto
              autoComplete="street-address"
              placeholder="Endereço: rua, número, bairro"
              value={formulario.endereco}
              onChange={(e) => atualizarFormulario({ endereco: e.target.value })}
            />
            <Field
              rotulo="Ponto de referência"
              placeholder="Opcional"
              value={formulario.referencia}
              onChange={(e) => atualizarFormulario({ referencia: e.target.value })}
            />
          </>
        ) : null}
      </div>

      <div role="group" aria-labelledby={idPagamento} className="flex flex-col gap-2">
        <span id={idPagamento} className="text-[13px] font-semibold text-muted">
          Pagamento
        </span>
        <div className="grid grid-cols-2 gap-2">
          {PAGAMENTOS.map(({ valor, rotulo }) => (
            <ChoiceButton
              key={valor}
              ativo={formulario.formaDePagamento === valor}
              texto="pagamento"
              onClick={() => atualizarFormulario({ formaDePagamento: valor })}
            >
              {rotulo}
            </ChoiceButton>
          ))}
        </div>
        {formulario.formaDePagamento === 'Dinheiro' ? (
          <Field
            rotulo="Troco para quanto?"
            rotuloOculto
            inputMode="decimal"
            placeholder="Troco para quanto?"
            value={formulario.troco}
            onChange={(e) => atualizarFormulario({ troco: e.target.value })}
          />
        ) : null}
      </div>

      <TextAreaField
        rotulo="Observação"
        placeholder="Ex.: sem cebola"
        rows={2}
        value={formulario.observacao}
        onChange={(e) => atualizarFormulario({ observacao: e.target.value })}
      />
    </div>
  )
}
