import { useId, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { cx } from '../../lib/cx'
import { IconeOlho, IconeOlhoRiscado } from './icones'

// Campo de texto (spec, seção 8). Todo campo tem <label> ligado por htmlFor, mesmo quando visualmente oculto.
//   cliente      : celular do cliente e login: h46 px14, raio 12, fundo surface, texto 15
//   loja         : formularios da loja no computador: h44 px12, raio 10, fundo surface, texto 14
//   loja-celular : como `loja`, mas com fundo branco, porque fica dentro de um cartao surface

export type VarianteDeCampo = 'cliente' | 'loja' | 'loja-celular'

interface PropsComuns {
  rotulo: string
  /** esconde o rotulo so visualmente (continua lido por leitores de tela) */
  rotuloOculto?: boolean
  variante?: VarianteDeCampo
  erro?: string | null
  ajuda?: string
}

function classesDoCampo(variante: VarianteDeCampo, multilinha: boolean, comErro: boolean): string {
  return cx(
    'w-full border text-ink outline-none transition-colors placeholder:text-subtle',
    variante === 'cliente' ? 'rounded-escolha px-[14px] text-[15px]' : 'rounded-tamanho px-3 text-[14px]',
    variante === 'loja-celular' ? 'bg-white' : 'bg-surface',
    !multilinha && (variante === 'cliente' ? 'h-[46px]' : 'h-[44px]'),
    multilinha && 'min-h-[88px] resize-y py-3',
    comErro ? 'border-brand' : 'border-line focus:border-ink',
  )
}

function classesDoRotulo(variante: VarianteDeCampo, oculto: boolean): string {
  if (oculto) return 'so-leitor'
  return variante === 'cliente' ? 'text-[13px] font-semibold text-muted' : 'text-[14px] font-bold text-ink'
}

function Envoltorio({
  id,
  rotulo,
  rotuloOculto = false,
  variante,
  erro,
  ajuda,
  children,
}: PropsComuns & { id: string; variante: VarianteDeCampo; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label htmlFor={id} className={classesDoRotulo(variante, rotuloOculto)}>
        {rotulo}
      </label>
      {children}
      {ajuda && !erro ? (
        <p id={`${id}-ajuda`} className="text-[12px] text-muted">
          {ajuda}
        </p>
      ) : null}
      {erro ? (
        <p id={`${id}-erro`} role="alert" className="text-[12px] font-semibold text-brand-strong">
          {erro}
        </p>
      ) : null}
    </div>
  )
}

function descricaoDoCampo(id: string, erro?: string | null, ajuda?: string): string | undefined {
  if (erro) return `${id}-erro`
  if (ajuda) return `${id}-ajuda`
  return undefined
}

interface PropsDoField extends PropsComuns, Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  id?: string
  /** conteudo a direita, dentro do campo (ex.: o botao Mostrar/Ocultar da senha) */
  sufixo?: ReactNode
}

export function Field({ id: idDado, rotulo, rotuloOculto, variante = 'cliente', erro, ajuda, sufixo, className, ...resto }: PropsDoField) {
  const idAuto = useId()
  const id = idDado ?? idAuto

  return (
    <Envoltorio id={id} rotulo={rotulo} rotuloOculto={rotuloOculto} variante={variante} erro={erro} ajuda={ajuda}>
      <div className="relative">
        <input
          id={id}
          aria-invalid={erro ? true : undefined}
          aria-describedby={descricaoDoCampo(id, erro, ajuda)}
          className={cx(classesDoCampo(variante, false, Boolean(erro)), sufixo ? 'pr-[84px]' : false, className)}
          {...resto}
        />
        {sufixo}
      </div>
    </Envoltorio>
  )
}

interface PropsDoTextArea extends PropsComuns, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  id?: string
}

export function TextAreaField({ id: idDado, rotulo, rotuloOculto, variante = 'cliente', erro, ajuda, className, ...resto }: PropsDoTextArea) {
  const idAuto = useId()
  const id = idDado ?? idAuto

  return (
    <Envoltorio id={id} rotulo={rotulo} rotuloOculto={rotuloOculto} variante={variante} erro={erro} ajuda={ajuda}>
      <textarea
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descricaoDoCampo(id, erro, ajuda)}
        className={cx(classesDoCampo(variante, true, Boolean(erro)), className)}
        {...resto}
      />
    </Envoltorio>
  )
}

// Senha com botao "Mostrar" / "Ocultar" a direita (13/600 muted, aria-pressed, area de toque de 44)
export function PasswordField({
  senhaNova = false,
  variante = 'cliente',
  ...resto
}: Omit<PropsDoField, 'type' | 'sufixo' | 'autoComplete'> & {
  /** `true` em "nova senha" e "confirmar": o navegador oferece gerar uma senha */
  senhaNova?: boolean
}) {
  const [visivel, setVisivel] = useState(false)
  const alturaDoCampo = variante === 'cliente' ? 'h-[46px]' : 'h-[44px]'

  return (
    <Field
      {...resto}
      variante={variante}
      type={visivel ? 'text' : 'password'}
      autoComplete={senhaNova ? 'new-password' : 'current-password'}
      sufixo={
        <button
          type="button"
          aria-pressed={visivel}
          onClick={() => setVisivel((v) => !v)}
          className={cx('absolute top-0 right-1 inline-flex min-w-[72px] items-center justify-center gap-1 px-2 text-[13px] font-semibold text-muted hover:text-ink', alturaDoCampo)}
        >
          {visivel ? <IconeOlhoRiscado tamanho={16} /> : <IconeOlho tamanho={16} />}
          {visivel ? 'Ocultar' : 'Mostrar'}
        </button>
      }
    />
  )
}
