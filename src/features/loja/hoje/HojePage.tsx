import { useState, type FormEvent } from 'react'
import { Banner, Button, Field } from '../../../components/ui'
import { cx } from '../../../lib/cx'
import { formatWhatsAppLoja } from '../../../lib/formatar'
import { useIsDesktop } from '../../../lib/useIsDesktop'
import { Pode } from '../../auth/Pode'
import { usePermissao } from '../../auth/useSessao'
import { AcabouAlgumaCoisa } from '../AcabouAlgumaCoisa'
import { useAlterarWhatsApp, useRestauranteDaLoja } from '../useRestauranteDaLoja'

const ID_DO_CAMPO_WHATSAPP = 'whatsapp-da-loja'

// Aba Hoje (spec, 11.2): cada bloco so aparece com a permissao correspondente.
//   AbrirFecharLoja -> cartao de status; AlterarWhatsApp -> cartao do WhatsApp; EsgotarOpcoes -> "Acabou alguma coisa?"
export function HojePage() {
  const desktop = useIsDesktop()
  const podeAlterarWhatsApp = usePermissao('AlterarWhatsApp')

  // abrir sem WhatsApp cadastrado volta 400: com AlterarWhatsApp, leva a pessoa direto ao campo
  function focarNoWhatsApp() {
    if (podeAlterarWhatsApp) document.getElementById(ID_DO_CAMPO_WHATSAPP)?.focus()
  }

  const lateral = (
    <div className="flex min-w-[300px] flex-1 flex-col gap-4">
      <Pode permissao="AbrirFecharLoja">
        <CartaoDeStatus aoRecusarAbrir={focarNoWhatsApp} />
      </Pode>
      <Pode permissao="AlterarWhatsApp">
        <CartaoDoWhatsApp />
      </Pode>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <h1 className={cx('font-extrabold', desktop ? 'text-[24px]' : 'text-[22px]')}>Hoje</h1>
      {desktop ? (
        <div className="flex flex-wrap items-start gap-6">
          {lateral}
          <Pode permissao="EsgotarOpcoes">
            <div className="min-w-[480px] flex-[2]">
              <AcabouAlgumaCoisa layout="grade" />
            </div>
          </Pode>
        </div>
      ) : (
        <>
          {lateral}
          <Pode permissao="EsgotarOpcoes">
            <AcabouAlgumaCoisa layout="lista" />
          </Pode>
        </>
      )}
    </div>
  )
}

// Cartao de status da loja (AbrirFecharLoja). Estado de GET /restaurante, reconsultado a cada 60 s.
function CartaoDeStatus({ aoRecusarAbrir }: { aoRecusarAbrir: () => void }) {
  const desktop = useIsDesktop()
  const { restaurante, definirAberta, alternando } = useRestauranteDaLoja()

  if (!restaurante) {
    return <div role="status" aria-busy="true" aria-label="Carregando o estado da loja" className="h-[120px] animate-pulse rounded-cartao bg-canvas" />
  }

  const aberta = restaurante.aberto

  return (
    <section
      aria-label="Estado da loja"
      className={cx('flex flex-col gap-3 rounded-cartao', desktop ? 'border border-line-soft bg-white p-5' : 'bg-surface p-4')}
    >
      <div className="flex items-center gap-[10px]">
        <span aria-hidden="true" className={cx('h-[10px] w-[10px] rounded-full', aberta ? 'bg-success' : 'bg-brand')} />
        <h2 className={cx('font-extrabold', desktop ? 'text-[22px]' : 'text-[18px]')}>{aberta ? 'Loja aberta' : 'Loja fechada'}</h2>
      </div>
      <p className={cx('text-muted', desktop ? 'text-[14px]' : 'text-[13px]')}>
        {aberta ? 'Clientes conseguem pedir agora.' : 'Clientes veem o cardápio, mas não conseguem pedir.'}
      </p>
      <div>
        <Button
          variante="primary-ink"
          altura={desktop ? 46 : 44}
          raio={desktop ? 'escolha' : 'pilula'}
          larguraTotal={!desktop}
          ocupado={alternando}
          onClick={() => definirAberta(!aberta, aberta ? undefined : aoRecusarAbrir)}
        >
          {aberta ? 'Fechar a loja' : 'Abrir a loja'}
        </Button>
      </div>
    </section>
  )
}

// Cartao "WhatsApp da loja" (AlterarWhatsApp): numero atual formatado e campo para alterar
function CartaoDoWhatsApp() {
  const desktop = useIsDesktop()
  const { restaurante } = useRestauranteDaLoja()
  const troca = useAlterarWhatsApp()
  const [numero, setNumero] = useState('')
  const [vazio, setVazio] = useState(false)

  function aoSalvar(evento: FormEvent) {
    evento.preventDefault()
    troca.reset()
    if (numero.trim() === '') {
      setVazio(true)
      return
    }
    setVazio(false)
    troca.mutate(numero.trim(), { onSuccess: () => setNumero('') })
  }

  const atual = restaurante?.whatsApp ? formatWhatsAppLoja(restaurante.whatsApp) : null
  const erro = vazio ? 'Informe o número do WhatsApp.' : troca.isError ? troca.error.message : null

  return (
    <section
      aria-label="WhatsApp da loja"
      className={cx('flex flex-col gap-3 rounded-cartao', desktop ? 'border border-line-soft bg-white p-5' : 'bg-surface p-4')}
    >
      <h2 className={cx('font-extrabold', desktop ? 'text-[18px]' : 'text-[16px]')}>WhatsApp da loja</h2>
      {atual ? (
        <p className="text-[16px] font-bold">{atual}</p>
      ) : (
        <>
          <p className="text-[16px] font-bold">Não cadastrado</p>
          <p className="text-[13px] text-muted">A loja só abre com o WhatsApp cadastrado.</p>
        </>
      )}

      <form onSubmit={aoSalvar} noValidate className="flex flex-col gap-3">
        <Field
          id={ID_DO_CAMPO_WHATSAPP}
          rotulo="Novo número"
          variante={desktop ? 'loja' : 'loja-celular'}
          type="tel"
          inputMode="tel"
          autoComplete="off"
          placeholder="+55 (31) 99999-9999"
          value={numero}
          onChange={(e) => {
            setNumero(e.target.value)
            setVazio(false)
          }}
          erro={erro}
        />
        {troca.isSuccess ? <Banner tipo="sucesso">WhatsApp atualizado.</Banner> : null}
        <div>
          <Button type="submit" variante="primary-ink" ocupado={troca.isPending} rotuloOcupado="Salvando...">
            Salvar
          </Button>
        </div>
      </form>
    </section>
  )
}
