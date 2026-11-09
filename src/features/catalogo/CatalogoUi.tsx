import { useState, type ReactNode } from 'react'
import {
  AvailabilityToggle,
  Banner,
  BottomTabBar,
  Button,
  Chip,
  ChoiceButton,
  ClientStatusBadge,
  Dialog,
  Field,
  FilterPill,
  IconeVoltar,
  IconeWhatsApp,
  IngredientTile,
  LineStepper,
  LinkButton,
  ListCheckbox,
  Logo,
  MarmitaIllustration,
  OrderStatusPill,
  PasswordField,
  SizeButton,
  SizeCard,
  Stepper,
  StatusButton,
  Tabs,
  TextAreaField,
  TopNavPill,
} from '../../components/ui'
import type { VarianteDeBotao } from '../../components/ui/botaoClasses'

// Catalogo interno de componentes (spec, seção 20, fase 2): rota /_ui, SO em desenvolvimento.
// Serve para conferir cada estado de cada atomo. Os textos sao genericos de proposito: nenhum dado dos prototipos.

const VARIANTES: VarianteDeBotao[] = ['primary-ink', 'primary-brand', 'outline-brand', 'outline', 'ghost-back', 'whatsapp']

const TOKENS_DE_COR = [
  'brand',
  'brand-strong',
  'brand-hover',
  'brand-tint',
  'ink',
  'ink-hover',
  'muted',
  'subtle',
  'line',
  'line-soft',
  'surface',
  'canvas',
  'disabled-bg',
  'disabled-fg',
  'blocked',
  'success',
  'success-text',
  'success-bg',
  'success-line',
  'warn-bg',
  'warn-text',
  'warn-row',
  'status-neutral-bg',
  'status-neutral-fg',
  'tile-selected-bg',
  'illustration-bg',
  'cat-carne',
  'cat-acompanhamento',
  'cat-guarnicao',
  'cat-salada',
  'cat-bebida',
  'cat-sobremesa',
]

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-b border-line-soft py-8">
      <h2 className="text-[18px] font-bold">{titulo}</h2>
      {children}
    </section>
  )
}

function Linha({ legenda, children }: { legenda: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[12px] font-bold tracking-[0.5px] text-muted uppercase">{legenda}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

// renderizado DENTRO do roteador do app (rota /_ui): o <Link> do SizeCard ja funciona, sem um Router proprio
export function CatalogoUi() {
  const [filtro, setFiltro] = useState('todas')
  const [tamanho, setTamanho] = useState('M')
  const [escolha, setEscolha] = useState('Retirada')
  const [marcados, setMarcados] = useState<Record<string, boolean>>({ a: true })
  const [qtd, setQtd] = useState(1)
  const [qtdLinha, setQtdLinha] = useState(2)
  const [check, setCheck] = useState(true)
  const [aberta, setAberta] = useState(true)
  const [esgotado, setEsgotado] = useState(false)
  const [aba, setAba] = useState('pedidos')
  const [dialogo, setDialogo] = useState(false)

  const abas = [
    { id: 'pedidos', rotulo: 'Pedidos' },
    { id: 'hoje', rotulo: 'Hoje' },
    { id: 'cardapio', rotulo: 'Cardápio' },
  ]

  return (
    <main className="mx-auto max-w-[980px] px-6 py-8">
      <h1 className="text-[28px] font-extrabold">Catálogo de componentes</h1>
      <p className="mt-1 text-muted">Só em desenvolvimento. Cada seção mostra os estados do componente.</p>

      <Secao titulo="Tokens de cor">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
          {TOKENS_DE_COR.map((nome) => (
            <div key={nome} className="flex flex-col gap-1">
              <span className="h-10 rounded-escolha border border-line" style={{ backgroundColor: `var(--${nome})` }} />
              <span className="text-[11px] text-muted">{nome}</span>
            </div>
          ))}
        </div>
      </Secao>

      <Secao titulo="Logo">
        <Linha legenda="Cliente: computador e celular">
          <Logo tamanho="desktop" />
          <Logo tamanho="celular" />
        </Linha>
        <Linha legenda="Loja: computador (com Painel da loja) e celular">
          <Logo tamanho="desktop" contexto="loja" comPainel />
          <Logo tamanho="celular" contexto="loja" />
        </Linha>
      </Secao>

      <Secao titulo="Button">
        {VARIANTES.map((v) => (
          <Linha key={v} legenda={v}>
            <Button variante={v} altura={52}>
              {v === 'ghost-back' ? (
                <>
                  <IconeVoltar tamanho={18} /> Cardápio
                </>
              ) : (
                'Ação'
              )}
            </Button>
            <Button variante={v} altura={44} disabled>
              Desabilitado
            </Button>
            <Button variante={v} altura={46} ocupado rotuloOcupado="Salvando...">
              Salvar
            </Button>
          </Linha>
        ))}
        <Linha legenda="Alturas: 52, 48, 46, 44, 40, 36, 34">
          {([52, 48, 46, 44, 40, 36, 34] as const).map((h) => (
            <Button key={h} altura={h} variante="outline">
              {h}
            </Button>
          ))}
        </Linha>
        <Linha legenda="Raios: pílula, confirmar (14), escolha (12), tamanho (10)">
          <Button raio="pilula">Pílula</Button>
          <Button raio="confirmar" altura={52}>
            Confirmar
          </Button>
          <Button raio="escolha" altura={44}>
            Escolha
          </Button>
          <Button raio="tamanho" altura={40}>
            Tamanho
          </Button>
        </Linha>
        <Linha legenda="LinkButton (link com cara de botão)">
          <LinkButton href="#catalogo" variante="whatsapp">
            <IconeWhatsApp /> Enviar no WhatsApp
          </LinkButton>
        </Linha>
      </Secao>

      <Secao titulo="Pílulas e seletores">
        <Linha legenda="FilterPill: computador e celular">
          {['todas', 'a', 'b'].map((id) => (
            <FilterPill key={id} ativa={filtro === id} onClick={() => setFiltro(id)}>
              {id === 'todas' ? 'Todas' : `Categoria ${id.toUpperCase()}`}
            </FilterPill>
          ))}
          {['todas', 'a'].map((id) => (
            <FilterPill key={`c${id}`} tamanho="celular" ativa={filtro === id} onClick={() => setFiltro(id)}>
              {id === 'todas' ? 'Todas' : 'Categoria A'}
            </FilterPill>
          ))}
        </Linha>
        <Linha legenda="TopNavPill">
          <TopNavPill ativa>Ativa</TopNavPill>
          <TopNavPill ativa={false}>Inativa</TopNavPill>
        </Linha>
        <Linha legenda="SizeButton: computador e celular">
          {['P', 'M', 'G'].map((t) => (
            <SizeButton key={t} ativo={tamanho === t} onClick={() => setTamanho(t)}>
              {t}
            </SizeButton>
          ))}
          <SizeButton ativo tamanho="celular">
            M
          </SizeButton>
        </Linha>
        <Linha legenda="ChoiceButton: cliente 44, loja 38">
          {['Retirada', 'Entrega'].map((e) => (
            <ChoiceButton key={e} ativo={escolha === e} onClick={() => setEscolha(e)}>
              {e}
            </ChoiceButton>
          ))}
          <ChoiceButton ativo altura={38} raio="loja" texto="categoria">
            Categoria
          </ChoiceButton>
          <ChoiceButton ativo={false} texto="pagamento">
            Pagamento
          </ChoiceButton>
        </Linha>
        <Linha legenda="SizeCard (celular)">
          <div className="grid w-[300px] grid-cols-3 gap-[10px]">
            {['P', 'M', 'G'].map((t, i) => (
              <SizeCard key={t} nome={t} itens={i + 2} preco={10 + i * 5} para="#catalogo" />
            ))}
          </div>
        </Linha>
      </Secao>

      <Secao titulo="IngredientTile">
        <Linha legenda="Padrão, marcado, bloqueado, esgotado, categoria desconhecida">
          <IngredientTile nome="Item A" categoria="Carne" marcado={marcados['a'] ?? false} onAlternar={() => setMarcados((m) => ({ ...m, a: !m['a'] }))} />
          <IngredientTile nome="Item B" categoria="Acompanhamento" marcado={marcados['b'] ?? false} onAlternar={() => setMarcados((m) => ({ ...m, b: !m['b'] }))} />
          <IngredientTile nome="Item C" categoria="Guarnicao" marcado={false} bloqueado onAlternar={() => undefined} />
          <IngredientTile nome="Item D" categoria="Salada" marcado={false} bloqueado esgotado onAlternar={() => undefined} />
          <IngredientTile nome="Item E" categoria="CategoriaNova" marcado={false} onAlternar={() => undefined} />
        </Linha>
      </Secao>

      <Secao titulo="Steppers">
        <Linha legenda="Stepper do produto (mínimo 1)">
          <Stepper valor={qtd} aoMudar={setQtd} rotulo="Quantidade do produto" />
        </Linha>
        <Linha legenda="Stepper de linha: computador e celular (chegar a 0 remove o item)">
          <LineStepper valor={qtdLinha} aoMudar={(n) => setQtdLinha(Math.max(n, 0))} nomeDoItem="Item A" />
          <LineStepper valor={qtdLinha} aoMudar={(n) => setQtdLinha(Math.max(n, 0))} nomeDoItem="Item A" tamanho="celular" />
        </Linha>
      </Secao>

      <Secao titulo="Campos">
        <div className="grid gap-4 md:grid-cols-2">
          <Field rotulo="Cliente (46)" placeholder="Digite aqui" />
          <Field rotulo="Loja (44)" variante="loja" placeholder="Digite aqui" ajuda="Texto de ajuda" />
          <div className="bg-surface rounded-cartao p-4">
            <Field rotulo="Loja no celular (fundo branco)" variante="loja-celular" placeholder="Digite aqui" />
          </div>
          <Field rotulo="Com erro" erro="Mensagem de erro do campo" defaultValue="valor" />
          <PasswordField rotulo="Senha" />
          <PasswordField rotulo="Nova senha" senhaNova variante="loja" />
          <TextAreaField rotulo="Observação" placeholder="Opcional" />
          <Field rotulo="Rótulo visualmente oculto" rotuloOculto placeholder="Placeholder visível; o rótulo só para leitores de tela" />
        </div>
      </Secao>

      <Secao titulo="Checkbox de lista">
        <div className="flex max-w-[320px] flex-col">
          <ListCheckbox marcado={check} onAlternar={() => setCheck((c) => !c)}>
            Item marcável
          </ListCheckbox>
          <ListCheckbox marcado={false} desabilitado onAlternar={() => undefined}>
            Desabilitado
          </ListCheckbox>
          <ListCheckbox marcado desabilitado onAlternar={() => undefined}>
            Marcado e desabilitado
          </ListCheckbox>
        </div>
      </Secao>

      <Secao titulo="Banner e Chip">
        <div className="flex max-w-[520px] flex-col gap-3">
          <Banner tipo="erro">Mensagem de erro (role=alert)</Banner>
          <Banner tipo="sucesso">Mensagem de sucesso</Banner>
          <Banner tipo="aviso">Mensagem de aviso</Banner>
          <Banner tipo="info">Mensagem informativa</Banner>
        </div>
        <Linha legenda="Chip: permissão, papel, superuser">
          <Chip>Permissão</Chip>
          <Chip variante="papel">Papel</Chip>
          <Chip variante="superuser">Superuser</Chip>
        </Linha>
      </Secao>

      <Secao titulo="Indicadores de status">
        <Linha legenda="Selo do cliente">
          <ClientStatusBadge aberta />
          <ClientStatusBadge aberta={false} />
        </Linha>
        <Linha legenda="Selo do pedido na loja">
          <OrderStatusPill status="Enviado" />
          <OrderStatusPill status="Gerado" />
          <OrderStatusPill status="StatusNovo" />
        </Linha>
        <Linha legenda="StatusButton: web, celular e informativo (sem permissão)">
          <StatusButton aberta={aberta} aoAlternar={() => setAberta((a) => !a)} />
          <StatusButton aberta={aberta} aoAlternar={() => setAberta((a) => !a)} tamanho="celular" />
          <StatusButton aberta={aberta} />
        </Linha>
        <Linha legenda="AvailabilityToggle: interativo e informativo">
          <AvailabilityToggle nome="Item A" esgotado={esgotado} aoAlternar={() => setEsgotado((e) => !e)} />
          <AvailabilityToggle nome="Item A" esgotado={esgotado} aoAlternar={() => setEsgotado((e) => !e)} tamanho="celular" altura={34} />
          <AvailabilityToggle nome="Item A" esgotado={esgotado} />
        </Linha>
      </Secao>

      <Secao titulo="Navegação da loja">
        <Tabs abas={abas} ativa={aba} aoSelecionar={setAba} rotulo="Áreas da loja (exemplo)" />
        <div className="max-w-[420px] overflow-hidden rounded-cartao border border-line-soft">
          <BottomTabBar abas={abas} ativa={aba} aoSelecionar={setAba} rotulo="Áreas da loja no celular (exemplo)" />
        </div>
      </Secao>

      <Secao titulo="Dialog e ilustração">
        <Linha legenda="Dialog (foco preso, Esc fecha, foco volta ao botão)">
          <Button variante="outline" onClick={() => setDialogo(true)}>
            Abrir diálogo
          </Button>
        </Linha>
        <Dialog
          aberto={dialogo}
          aoFechar={() => setDialogo(false)}
          titulo="Título do diálogo"
          descricao="Texto de apoio do diálogo."
          acoes={
            <>
              <Button variante="outline" onClick={() => setDialogo(false)}>
                Cancelar
              </Button>
              <Button variante="primary-brand" onClick={() => setDialogo(false)}>
                Confirmar
              </Button>
            </>
          }
        />
        <div className="bg-illustration-bg grid w-fit place-items-center rounded-ilustracao p-6">
          <MarmitaIllustration />
        </div>
      </Secao>
    </main>
  )
}
