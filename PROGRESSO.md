# PROGRESSO: execução da spec do frontend

Se a sessão for interrompida ou compactada: **releia este arquivo e `spec-frontend/00-indice.md`** e continue da fase marcada como "em andamento".

- Spec: `spec-frontend/` (cópia da pasta recebida; ler primeiro `00-indice.md`). Plano de fases: seção 20, em `spec-frontend/09-textos-testes-entrega.md`.
- Raiz do projeto: esta pasta (`kf-restaurante-frontend`), repositório separado do backend. A spec fala em `frontend/` dentro de um monorepo; o usuário decidiu por repositórios separados, então `frontend/` = esta raiz.
- Backend lido: `main` no commit `c5bad65`, o mesmo que a spec leu.

## Fase atual

**Todas as 11 fases concluídas.** Cada fase tem o hash do seu commit na tabela abaixo.

## Fases concluídas

| Fase | Commit | O que entrou |
|---|---|---|
| 1. Projeto base | `afbc430` | Vite, TypeScript strict, Tailwind v4 com tokens, Inter auto-hospedada, rotas vazias (`/loja/*` lazy), client de API com `ProblemDetails`/401/403, 1 arquivo por recurso (33 rotas), TanStack Query, Vitest + MSW (14 testes), `.env.example` |
| 2. Átomos e catálogo `/_ui` | `1c56700` | 20 átomos em `components/ui/` com as medidas da seção 8 (Logo, Button/LinkButton, FilterPill, TopNavPill, SizeButton, ChoiceButton, SizeCard, IngredientTile, Stepper, LineStepper, Field/PasswordField/TextAreaField, ListCheckbox, Banner, Chip, Dialog, ClientStatusBadge, OrderStatusPill, StatusButton, AvailabilityToggle, Tabs, BottomTabBar, MarmitaIllustration), ícones SVG, `lib/` (categoriaConfig, formatar, statusPedido, useIsDesktop), catálogo `/_ui` só em dev, 120 testes |
| 3. Autenticação | `b9eaf34` | `AuthProvider` (só dentro de `/loja`), login `/loja/entrar`, sessão em `sessionStorage`, guardas `RequerSessao`/`RequerAba`, `GET /auth/eu` (foco, 60 s, após 403), expiração por horário, `UserMenu`, `LojaLayout` com abas por permissão, `SemAcesso`, `ContaPage` (trocar senha), `lib/permissoes.ts`, hooks `useSessao`/`usePermissao`/`usePermissoes`/`useEhGestor` e `<Pode>`; testes 7, 8 e 9 (33 novos, 153 no total) |
| 4. Cliente celular | `9dc2b4f` | Telas 1 a 4 com dados reais (`CardapioMobile`, `MontarMobile`, `PedidoMobile`, `ConfirmacaoPage`), carrinho e formulário em Context + reducer (`ClienteProvider`), `useDadosDoCliente` (restaurante, cardápio de hoje e tamanhos; reconsulta a cada 60 s e no foco), `useMontagem`, `useFinalizarPedido`, `FormularioDoPedido` e `LinhaDoCarrinho` (já compartilhados com a fase 5), regras puras em `lib/regrasMarmita`, `lib/carrinho` e `lib/pedidoCliente`; testes 1, 2, 3, 11 e 12 (58 novos, 211 no total) |
| 5. Cliente desktop | `05506e3` | `PaginaDesktop` (filtros, produto, "Pra acompanhar" e carrinho lateral com o mesmo `FormularioDoPedido` do celular, "Confirmar pedido"), escolha do layout por `useIsDesktop` em `PaginaInicial`, `/montar/:id` vira `/?tamanho=:id` e `/pedido` volta a `/` no computador, confirmação centralizada (max 680) com os botões no corpo; 13 testes novos (224 no total) |
| 6. Loja: casca e aba Pedidos | `7f55a5e` | `LojaLayout` com cabeçalho (Logo + "Painel da loja", `StatusButton` e `UserMenu`), abas por permissão e banner de erro de mutação (`AvisosDaLoja`); `PedidosPage` com filtros por contagem, tabela (computador) e cartões (celular), detalhe sob demanda com cache sem expiração, polling de 30 s, anúncio de pedido novo, "Chamar no WhatsApp"; coluna `AcabouAlgumaCoisa` (EsgotarOpcoes) com atualização otimista; testes 5 e 9 completos e o selo da loja; 25 testes novos (249 no total) |
| 7. Loja: abas Hoje e Cardápio | `10170db` | `HojePage` (cartão de status com foco no WhatsApp quando abrir é recusado, cartão do WhatsApp com erro do 400 junto do campo, "Acabou alguma coisa?" em grade ou lista); `CardapioPage` com os 4 estados (sem cardápio, rascunho, publicado, fechado), descoberta do cardápio de hoje (GET /cardapios/hoje, depois o id do `localStorage`), 409 com a explicação do rascunho; teste 13 completo e a navegação do topo do computador conforme a seção 16.2; 30 testes novos (279 no total) |
| 8. Loja: aba Cadastros | `9913bf1` | `CadastrosPage` (computador: Opções e Tamanhos lado a lado; celular: duas `ChoiceButton`), `OpcoesSecao` com tabela/linhas e formulário (regra do preço: Bebida e Sobremesa exigem, componente só com "Vender também avulsa"; 409 abaixo do Nome, 400 em Banner), `TamanhosSecao` com cartões, formulário e limites por categoria (`PUT /tamanhos/{id}/limites` substitui tudo); `lib/cadastros` e `lib/dinheiro`; 36 testes novos (315 no total) |
| 9. Loja: aba Usuários | `9fd6679` | `UsuariosPage` (tabela no computador, cartões no celular, marca "Você", só "Minha conta" na própria linha), formulários "Novo usuário" e "Editar" com a hierarquia espelhada (`lib/usuarios`: papéis que cada um cria, permissões que cada um concede, checkbox habilitado se quem edita tem a permissão ou o editado já a tinha), `Dialog` de desativar e de redefinir senha, ativar sem confirmação; teste 10 completo; 23 testes novos (338 no total); `Pendente.tsx` removido |
| 10. Estados e acessibilidade | `ced700a` | Auditoria da seção 15: foco no título ao trocar de tela no celular (`useFocoNoTitulo`), foco no primeiro campo dos formulários, `<title>` por rota (`useTituloDaPagina`), anúncio aria-live da mudança de aba por falta de permissão, área de toque dos botões de texto; os estados de carregamento, vazio e erro da seção 14 já nasceram com cada tela e ganharam testes de erro para Opções, Tamanhos e Usuários; teste estático das regras de segurança (`seguranca.test.ts`); 24 testes novos (362 no total) |
| 11. Testes, README e aceite | `ef12b3c` | Os 13 testes da seção 18 estão cobertos (mapa em "Cobertura da seção 18", mais abaixo), README completo (rotas, abas por permissão, decisões, limitações, lacunas) e verificação contra a **API real** (43 checagens de contrato por script e 54 verificações de interface com o Edge, sem screenshots) que achou e corrigiu um bug de CSS que o jsdom não mostra; 365 testes no total |

## Divergências encontradas (spec x código)

O código do backend vence a spec; cada divergência é registrada aqui.

| # | Onde | Spec diz | Código diz | O que foi feito |
|---|---|---|---|---|
| 1 | (resolvida no backend depois das 11 fases) Mensagem de 401 e 403 sem corpo explicativo (seção 10.3) | "A mensagem para a tela é `detail` e, se não houver, `title`" | `UseStatusCodePages()` devolve `title` em inglês ("Unauthorized", "Forbidden") e nenhum `detail` | Sem `detail`, a tela usa um texto em português por status (401 "Você precisa entrar para continuar.", 403 "Você não tem permissão para fazer isso.", 404, 409, 5xx) em vez do `title` em inglês. Com `detail` (400, 403 de hierarquia, 409...), usa o `detail` da API |
| 2 | Dados do banco de desenvolvimento (não é divergência do código) | Tamanho do meio, ou o primeiro, é o padrão (seção 9.3) | O banco do usuário tem os tamanhos G (R$ 0,00, limite 0) e M (R$ 20,00, limite 3) | A tela segue a regra da spec: abre em "Marmita G" (inutilizável) e o cliente precisa tocar em M. É sobra de testes antigos; corrigir o tamanho G na aba Cadastros resolve |

Conferido na fase 0: as 33 rotas da seção 13 batem com as 33 de `EndpointsProtegidosTests` (7 abertas, 4 "logado", 7 de usuários, 15 por permissão).

## Lacunas do backend

Nada do backend era alterado durante as 11 fases. Depois delas, o usuário pediu para corrigir as lacunas, e o backend foi alterado (commit à parte, feito pelo usuário).

| # | Lacuna | Situação |
|---|---|---|
| 1 | Cardápio em rascunho não consultável pelo painel e sem como trocar as opções (seção 16, item 4) | **Corrigida.** `GET /cardapios/hoje/painel` (qualquer situação) e `PUT /cardapios/{id}/opcoes` (só rascunho). O front usa os dois, não guarda mais id no `localStorage` e permite trocar as opções do rascunho |
| 2 | `GET /pedidos` só com resumo (seção 16, item 9) | **Corrigida.** A lista traz itens, endereço, referência, observação e troco; o front removeu a busca de detalhe por pedido |
| 3 | `GET /pedidos/{id}` exige `VerPedidos` (seção 16, item 10) | **Mantida de propósito.** Abrir a rota ao cliente vazaria pedidos de outras pessoas por id sequencial. A confirmação segue com a resposta do `POST /pedidos` |
| 4 | 401 e 403 sem `detail` (divergência 1) | **Corrigida.** O backend manda `detail` em português; o texto padrão por status do front virou só reserva |
| 5 | Sem exclusão de dados | **Mantida.** Decisão de domínio (pedido é histórico) |

## Decisões tomadas

Decisões marcadas como "decisão minha" na spec seguem o padrão que a própria spec indica. Outras escolhas técnicas também entram aqui.

| # | Decisão | Motivo |
|---|---|---|
| 1 | A raiz `frontend/` da spec é a raiz deste repositório | O usuário decidiu por dois repositórios (backend e frontend) |
| 2 | Para onde a instrução do usuário e a spec divergem sobre parar e perguntar (lacuna de backend, biblioteca nova), vale a instrução mais recente do usuário: mitigar, registrar e seguir | O usuário pediu execução sem pausas, parando só em bloqueio real ou conflito que mude uma tela inteira |
| 3 | Sem screenshots automáticos | A seção 0 da spec proíbe verificação visual automática a menos que o usuário peça; só build, lint e testes |
| 4 | Bibliotecas fora da lista da seção 3: `jsdom`, `@testing-library/jest-dom`, `@testing-library/user-event` e `@tailwindcss/vite` | `jsdom` é o ambiente DOM que o Vitest exige; `jest-dom` traz os matchers de acessibilidade do RTL; `user-event` simula digitação e clique de forma realista (companheiro oficial do RTL); `@tailwindcss/vite` é a integração oficial do Tailwind v4 com o Vite (parte do Tailwind) |
| 5 | React 18 (a spec manda), em vez do React 19 que o template atual do Vite traz | A seção 3 diz "React 18". TanStack Query e React Router suportam as duas |
| 6 | Tailwind v4 (versão atual), tokens em CSS (`:root` + `@theme inline`), sem `tailwind.config` | A seção 3 manda usar o mecanismo da versão que o template suportar |
| 7 | TypeScript 7.0.2 (o do template) mantido, com `strict` e `noUncheckedIndexedAccess` ligados | `strict` é exigido pela spec; o segundo pega acesso a índice sem checar |
| 8 | MSW 3: a opção para recusar chamada sem handler é `onUnhandledFrame: 'error'` (na v2 era `onUnhandledRequest`) | Descoberto no build; a opção antiga era ignorada em silêncio |
| 9 | O client de API não conhece sessão: expõe `configurarAuth({ obterToken, aoNaoAutenticado, aoProibido })`, e o `AuthProvider` (fase 3) se registra. Só chamadas com `autenticada: true` levam o token e acionam 401/403 | Mantém "o token só vai nas chamadas da loja" garantido num único lugar, com teste |
| 10 | O 404 de `GET /cardapios/hoje` vira `null` na camada de API | A API devolve 404 tanto para "não existe" quanto para "rascunho"; para o cliente, as duas coisas são "ainda não publicado" |
| 11 | Enums da API aceitam valor desconhecido (`'Carne' \| (string & {})`) | A spec manda tolerar valores novos sem quebrar a tela |
| 12 | `src/features/Pendente.tsx` foi uma tela provisória das fases 1 a 8 | Rotas vazias da fase 1. **Removida na fase 9**, quando a última rota ganhou tela |
| 13 | `Dialog` é um componente próprio (portal + `role="dialog"` + foco preso + Esc + devolução do foco), não o `<dialog>` nativo | O `showModal()` do `<dialog>` não existe no jsdom, então não seria testável; o componente próprio também permite a folha de rodapé no celular |
| 14 | Área de toque de 44px dos controles menores via utilitários CSS `toque-v` e `toque-q` (pseudo-elemento invisível), sem mudar o desenho | A seção 15 exige 44px de toque, mas as medidas da seção 8 são menores (34 a 40). Os controles de 24 a 30px (steppers) usam `toque-q` |
| 15 | Token novo `--checkbox-disabled` (`#D7DADF`) | A seção 8 cita esse hex solto para o checkbox desabilitado; a regra é "todo hex sai dos tokens" |
| 16 | `categoriaConfig` ganhou o campo `plural` (`carnes`, `guarnições`...) | A seção 12.12 pede "1 carne / 2 carnes", e o plural de "guarnição" é irregular; somar "s" geraria "guarnições" errado |
| 17 | `Tabs` e `BottomTabBar` já existem como átomos (a fase 6 só os liga às permissões e às rotas) | A seção 8 os descreve entre os componentes base |
| 18 | O "hoje" do front usa o fuso `America/Sao_Paulo` (`hojeEmBrasilia`), alinhado ao da API | A API decide o "hoje" em Brasília; um `new Date()` em UTC erraria depois das 21h |
| 19 | Um teste de rotas pegou um bug real do catálogo (um `MemoryRouter` aninhado dentro do roteador do app, que o React Router proíbe). Corrigido | Registro porque o build e o lint passavam: só o teste de renderização mostrou |
| 20 | O usuário vem de `useQuery(['eu'])` (staleTime 0, `refetchInterval` 60 s, refetch no foco) em vez de timers próprios | O TanStack Query já pausa o intervalo com a aba em segundo plano, que é o que a seção 10.2 pede |
| 21 | Os ganchos do client (`configurarAuth`) são registrados num `useLayoutEffect` do `AuthProvider`, lendo o token de um `ref` | Roda antes dos efeitos dos filhos, então o token já existe na primeira chamada; o token nunca entra no valor do contexto |
| 22 | A rota pretendida (`state.de`) só é lembrada na visita direta. Depois de "Sair" ou de expirar, o login volta para `/loja` | Evita que a próxima pessoa caia na tela da anterior. O destino só aceita caminhos que começam com `/loja` |
| 23 | `LojaLayout` (Logo, `UserMenu`, abas por permissão, Banner de 403) já nasce na fase 3; o `StatusButton` e o conteúdo das abas entram na fase 6 | A seção 20 põe "abas por permissão" na fase 6, mas guardas e "sem acesso" da fase 3 precisam de uma casca para serem testadas |
| 24 | Do teste 9: `StatusButton` informativo e coluna "Acabou alguma coisa?" ficam para as fases 6 e 7 (as telas ainda não existem). O componente `StatusButton` já tem o teste de modo informativo (fase 2) | Cobertura fica completa ao fim da fase 7 |
| 25 | `Tabs` deixa a primeira aba alcançável pelo Tab quando nenhuma está ativa (ex.: Minha conta) | Sem isso o roving tabindex tirava a barra de abas do teclado nessa tela |
| 26 | Erros de preenchimento do login aparecem só ao enviar e somem do campo editado; a senha limpa após falha não gera "Informe a senha." | Bug que o teste pegou: validar derivando de `tentou` mostrava dois alertas depois de um 401 |
| 27 | `queryClient.clear()` ao sair deixa uma consulta `['eu']` vazia (o observador desabilitado a recria). Os testes conferem "nenhum dado", não "cache vazio" | É um detalhe do TanStack Query; sem dado, nada da loja sobra |
| 28 | Valores iniciais do formulário: "Retirada" e "Pix" | O payload exige uma forma de pagamento e um tipo de entrega; a spec não diz qual vem marcado |
| 29 | "Fazer outro pedido" limpa carrinho, confirmação, troco e observação, mas mantém nome, WhatsApp, entrega e pagamento | A spec manda limpar "o carrinho e a confirmação"; manter os dados da pessoa evita redigitar |
| 30 | O carrinho só é limpo em "Fazer outro pedido" (como a spec manda), não ao finalizar. A rota de confirmação substitui `/pedido` no histórico (`replace`) | Voltar do navegador não cai de novo no formulário de finalização |
| 31 | A linha do carrinho guarda nome e preço do momento em que foi adicionada; "acabou" é calculado ao vivo. Componente que saiu do cardápio conta como esgotado | A spec 9.1 pede preço unitário guardado; a API recalcula o total, então o front só avisa |
| 32 | Com item esgotado no carrinho, a mensagem acima do botão é "Remova os itens que acabaram" (além do texto da linha) | A spec só manda desabilitar o botão; sem mensagem o botão desabilitado ficaria sem explicação |
| 33 | `staleTime: 0` nas consultas de restaurante e cardápio | O padrão do `QueryClient` (15 s) engolia a reconsulta ao voltar o foco, que a spec 9.1 exige |
| 34 | (superada na fase 5) `/` no computador mostrava o layout do celular até a página única existir | Evitou deixar a rota vazia entre as fases |
| 35 | Loja fechada ou cardápio encerrado: tiles da montagem ficam bloqueados e `SizeCard` ganhou `desabilitado` (mesmo visual, sem navegar) | A seção 14 manda desabilitar adicionar, montar e finalizar |
| 36 | "Tamanho do meio" é o índice `floor((n - 1) / 2)` (n = 3 dá o segundo; n = 1 ou 2 dá o primeiro) | A spec só define 3 ou menos; o resto generaliza sem mudar esses casos |
| 37 | O telefone vai para a API só com dígitos | A API aceita com ou sem máscara; só dígitos evita surpresa |
| 38 | Nos testes, o `QueryClient` não repete falhas (`retry: false`) | A repetição de 1 s do app atrasaria cada teste de erro; o comportamento do app não muda |
| 39 | Navegação do topo do computador: "Marmitas" (rola ao produto), "Bebidas" e "Sobremesas" (rolam a "Pra acompanhar" filtrado). Bebidas e Sobremesas só aparecem se houver o que vender na categoria | Padrão da seção 16.2; "Vegetariano" não existe no backend |
| 40 | O stepper de quantidade do produto no computador cria UMA linha de marmita com essa quantidade (`adicionarMarmita(..., quantidade)`) | A spec 9.1 diz que o item de marmita tem quantidade; o botão "Adicionar" mostra o preço já multiplicado |
| 41 | No carrinho lateral aparece a mesma mensagem de pendência do celular, acima de "Confirmar pedido" | O botão fica desabilitado quando falta dado; sem a frase a pessoa não saberia o que falta |
| 42 | Os ingredientes do computador não são agrupados por categoria (um bloco só, filtrado pela pílula), como a spec 9.2 descreve; o limite por categoria continua valendo e só aparece no contador total | A spec só pede o grupo "até N" no celular (tela 2) |
| 43 | Erros de mutação da loja (abrir/fechar, esgotar) vão para um banner no topo do conteúdo por um contexto (`AvisosDaLoja`), ao lado do aviso de 403 | A seção 11 pede "Banner de erro no topo da área de conteúdo" para toda mutação; um contexto evita passar props por todas as abas |
| 44 | `AcabouAlgumaCoisa` já nasce com os três layouts (`coluna`, `grade`, `lista`); a fase 7 só o reutiliza na aba Hoje | A coluna da aba Pedidos (seção 11.1) e o bloco da aba Hoje (11.2) são a mesma lista, com a mesma regra otimista |
| 45 | Respostas de fundo no servidor MSW dos testes (`GET /restaurante`, `GET /pedidos`, `GET /cardapios/hoje` 404) | O cabeçalho e a aba Pedidos fazem essas leituras em qualquer teste logado; um teste que se importa registra o próprio handler, que tem prioridade. Chamada fora dessas continua dando erro |
| 46 | `Tabs` e `BottomTabBar` usam o rótulo "Seções da loja" | Seção 15, item 6 |
| 47 | O selo da loja no cabeçalho só aparece depois do primeiro `GET /restaurante` | Mostrar "fechada" por engano antes de saber o estado seria pior que esperar |
| 48 | O botão "Chamar no WhatsApp" ganhou `aria-label` com o nome do cliente e o número do pedido | Numa tabela com vários botões iguais, o leitor de tela precisa distinguir qual é de quem |
| 49 | A ordem da lista de pedidos é reforçada no cliente (hora e número, mais recente primeiro) | A spec diz que a API já devolve assim; a tela não depende disso |
| 50 | A tela do cardápio mostra o texto "Ainda não há cardápio de hoje. Escolha as opções e crie o cardápio." no estado 1, e "Nenhuma opção cadastrada ainda..." se não houver opção | A seção 11.3 não dá texto para esses dois casos |
| 51 | No celular, o botão de ação do cardápio fica `sticky` acima da barra de abas (`bottom-14`), não `fixed` | Evita sobrepor a barra de abas e não precisa de padding extra no fim da lista |
| 52 | A opção do cardápio usa `aria-label` só com o nome, para o nome acessível do checkbox não incluir a categoria e o preço | Os dois textos continuam visíveis |
| 53 | Salvar o WhatsApp mostra o Banner "WhatsApp atualizado." | A seção 11.2 não dá confirmação de sucesso; sem ela a pessoa não sabe se salvou |
| 54 | A leitura de valor em reais (troco, preço de opção, preço de tamanho) vive em `lib/dinheiro.ts` (`lerValorEmReais`); `lerTroco` continua exportada como apelido | Um parser só para os três campos |
| 55 | Salvar um tamanho em edição faz `PUT /tamanhos/{id}` e, em seguida, `PUT /tamanhos/{id}/limites`; criar só faz `POST /tamanhos`, e a seção de limites aparece depois, na edição (a tela diz isso) | A spec põe os limites "dentro do formulário de edição". Se a segunda chamada falhar, a primeira já valeu (a lista é reconsultada) |
| 56 | Nos formulários de cadastro o botão fica desabilitado até o formulário ser válido, e o erro de preço ou limite só aparece quando o campo tem texto | A spec manda desabilitar o botão; mostrar erro em campo vazio recém-aberto seria ruído |
| 57 | No cartão do tamanho, limite 0 aparece como "Salada: não incluso" (a spec dá só o exemplo "Carne: até 2") | Mesma frase da tela de montagem do cliente |
| 58 | Salvar uma opção também invalida as consultas do cardápio (`['cardapio']`) | O cardápio de hoje mostra nome, categoria e preço da opção |
| 59 | Na edição de usuário, todas as seis permissões aparecem (as que ninguém pode acrescentar ficam desabilitadas); na criação, só as que quem cria possui | É a regra da seção 11.5: manter é sempre permitido, acrescentar exige ter |
| 60 | Erro 403 de um formulário ou ação de usuários aparece só no banner global da área de conteúdo (do `AuthProvider`), não repetido no formulário | A seção 10.3 manda mostrar o 403 como banner e refazer `GET /auth/eu`; duplicar só poluiria a tela |
| 61 | O `Dialog` de redefinir senha ganhou o texto "A conta também é destravada. A pessoa troca a senha depois, em Minha conta." | A spec só pede o campo e o botão; o texto diz o efeito antes de confirmar |
| 62 | Nos testes, `asyncUtilTimeout` do Testing Library é 3 s | O primeiro teste de cada arquivo carrega a loja por import dinâmico e, com arquivos em paralelo, 1 s às vezes não bastava (testes intermitentes) |
| 63 | Criar usuário sem permissões marcadas envia `permissoes: []`; Superuser sempre envia `[]` | A API ignora a lista de superuser (ele tem todas) |
| 64 | O foco vai para o título da tela nova só no celular e só depois da primeira tela da página; o título ganhou `tabIndex={-1}`. A tela Cardápio do celular ganhou um `h1` visualmente oculto ("Cardápio") para receber o foco | No computador a troca de aba é feita no `tablist`, e tirar o foco dele quebraria a navegação por setas; a primeira tela não deve roubar o foco do navegador |
| 65 | `useTituloDaPagina`: "KF Restaurante" (cliente), "Entrar · KF Restaurante", "Painel da loja · KF Restaurante" e "Página não encontrada · KF Restaurante" | Seção 15.9 (a 4ª é a mesma regra aplicada à rota `*`) |
| 66 | O aviso de aba sem permissão ("Você não tem acesso a esta área. Abrimos Pedidos.") sai por uma região `aria-live` do layout da loja, também quando a pessoa abre direto uma URL que não pode | Seção 15.6 pede o anúncio; o texto não existe na spec |
| 67 | `seguranca.test.ts` lê os fontes por `import.meta.glob(..., { query: '?raw' })` em vez de `node:fs`; não confere o `.env.example` | Evita instalar `@types/node` (biblioteca fora da lista da seção 3) e o Vite bloqueia a importação de `.env*`. A regra "só `VITE_API_URL`" é conferida no código que a lê |
| 68 | Os botões de texto ("Tentar de novo", "Ir para o cardápio") ganharam `min-h-[44px]` | Seção 15.4: área de toque de 44px |
| 69 | Bug de CSS achado só no navegador real: `toque-v` e `toque-q` usavam `::after` absoluto sem `position: relative` no próprio elemento, e "Fazer outro pedido" (sem a classe `relative`) cobria a tela e roubava o clique de "Enviar no WhatsApp" no computador. As duas utilidades agora trazem o `relative`; `estilos.test.ts` garante | O jsdom não processa CSS, então os 362 testes anteriores passavam. É o motivo de ter rodado a interface contra a API real |
| 70 | `<p>` com `<div>` dentro (esqueleto do detalhe do pedido) virou `<div>` | O React avisava `validateDOMNesting` no navegador |
| 71 | A verificação contra a API real só criou pedidos de teste e contas `@teste.local` (ver "Riscos e pendências") | Para não mexer em cadastros, cardápio e estado da loja do banco de desenvolvimento |

## Riscos e pendências de entrega

- A pasta `referencia-conceito2/` (os 4 protótipos `.dc.html`) **não foi encontrada** na máquina nem dentro do `spec-frontend.zip`. A spec manda tratá-los só como leitura de medidas; a spec já traz tokens, medidas e textos. Se alguma medida faltar, vale a spec e o caso fica registrado aqui. Entregável 3 da seção 21 (colocar os 4 arquivos em `referencia-conceito2/`) fica **pendente**: o usuário precisa fornecê-los.

- **Dados de teste que ficaram no banco de desenvolvimento** (a API não tem exclusão e eu não tive credencial de banco): 10 pedidos de hoje com o nome "E2E Teste Cliente" ou "E2E Teste Debug" (nº 20 a 29, ids 20 a 29) e 3 contas `@teste.local` (`e2e-superuser` ativa, `e2e-dono` e `e2e-func` desativadas). O estado de "esgotado" do cardápio foi restaurado. Para limpar, no psql, confira os nomes das tabelas e rode algo como `DELETE FROM "ItensDoPedido" WHERE "PedidoId" BETWEEN 20 AND 29; DELETE FROM "Pedidos" WHERE "Id" BETWEEN 20 AND 29; DELETE FROM "Usuarios" WHERE "Email" LIKE '%@teste.local';`. O superuser `e2e-superuser` nasceu de variáveis de ambiente temporárias (a senha foi descartada); apague a conta junto.
- **Não verificado com ferramenta:** navegação por teclado completa nas duas áreas e contraste medido (sem axe nem leitor de tela). Foco, rótulos, semântica e os tokens da seção 15 estão cobertos por testes e por revisão; a conferência manual fica com o usuário.
- **Não exercido contra a API real pela interface** (só por testes e checagem de contrato): abrir e fechar a loja, publicar e fechar cardápio, criar e editar opções e tamanhos, alterar o WhatsApp, criar e editar usuários e trocar a própria senha.

## Critérios de aceite (seção 20)

**Conferidos ao final da fase 11.** `[x]` passou; `[~]` passou em parte (o que faltou está dito).

- [~] Os 4 fluxos (cliente celular, cliente desktop, loja celular, loja desktop) contra a API real: o cliente no computador (1440px) e no celular (390px) fez pedido de verdade, e a loja no computador e no celular entrou, listou pedidos, marcou esgotado (refletiu no cliente e foi desfeito), viu o cardápio e os usuários e saiu. Falta o que está em "Não exercido contra a API real", acima.
- [x] Sem login, `/loja` leva a `/loja/entrar`; o cliente funciona sem login e nenhuma chamada dele levou `Authorization` (navegador real).
- [x] Login correto entra na primeira aba permitida; credencial errada mostra a mensagem da API, sem pistas (a API dá a mesma mensagem para e-mail inexistente e senha errada).
- [x] Abas e blocos por permissão; mudar permissões reflete após `GET /auth/eu` com o mesmo token (testes e checagem real de `/auth/eu`).
- [x] 401 desloga com mensagem; 403 mostra mensagem sem deslogar; nenhuma tela em branco (testes; formato dos erros conferido na API real).
- [x] Sair limpa a sessão e o cache; voltar no navegador não mostra dados da loja (navegador real).
- [x] Dono cria só funcionário e só concede permissão que tem; superuser cria qualquer papel; ninguém desativa a si mesmo (testes de interface e checagem real da API).
- [x] Trocar a própria senha funciona e o aviso do bloqueio aparece (teste de interface; API real: 204, 400 "Senha atual incorreta." e 400 de senha curta).
- [x] Nenhum dado fictício dos protótipos no código ou na tela (os textos de exemplo vêm da própria spec; os dados de teste são genéricos).
- [x] Limites de total e por categoria bloqueiam e liberam, e a troca de tamanho segue a seção 12.2 (testes).
- [x] Pedido finalizado aparece como "Não enviado" e vira "Enviado" depois do clique em "Enviar no WhatsApp" (navegador real: nº 26 e 27).
- [x] A mensagem mostrada é exatamente a `mensagemWhatsApp` e o botão abre o `linkWhatsApp` (teste compara o texto idêntico; o navegador real abriu a nova aba do WhatsApp).
- [x] "Esgotado" na loja reflete no cliente (navegador real).
- [x] Loja fechada ou cardápio encerrado bloqueia o pedido, com faixa e selo (testes de celular e computador; não fechei a loja do banco real).
- [x] Todo erro 400, 401, 403, 404, 409 e de rede tem mensagem legível, sem `alert` e sem tela em branco (testes e teste estático).
- [~] Teclado, foco visível, rótulos e contraste: foco, rótulos e semântica por testes; navegação completa por teclado e contraste medido não foram conferidos com ferramenta.
- [x] Layouts em 390, 768, 1024 e 1440px sem rolagem horizontal da página (navegador real: cliente, login e as abas da loja).
- [x] `npm run build`, `npm run lint` e `npm test` passam sem aviso (365 testes).

### Cobertura da seção 18

| # | Onde |
|---|---|
| 1 | `lib/clienteLogica.test.ts` (regras da marmita) |
| 2 | `lib/clienteLogica.test.ts` (validação do formulário) |
| 3 | `lib/clienteLogica.test.ts` (payload) |
| 4 | `lib/lib.test.ts` (categoriaConfig) |
| 5 | `lib/lib.test.ts` e `features/loja/pedidos/pedidos.test.tsx` |
| 6 | `lib/lib.test.ts` |
| 7 | `features/auth/sessao.test.tsx` |
| 8 | `features/auth/sessao.test.tsx` e `api/client.test.ts` |
| 9 | `features/auth/permissoes.test.tsx`, `features/loja/pedidos/pedidos.test.tsx` (StatusButton e coluna "Acabou alguma coisa?") e `components/ui/Loja.test.tsx` |
| 10 | `features/loja/usuarios/usuarios.test.tsx` |
| 11 | `features/cliente/clienteCelular.test.tsx` e `features/cliente/clienteDesktop.test.tsx` |
| 12 | `features/cliente/clienteCelular.test.tsx` e `features/cliente/clienteDesktop.test.tsx` |
| 13 | `features/loja/cardapio/cardapio.test.tsx` |


## Depois das 11 fases: correção das lacunas do backend

- Backend: `CardapioDoDia.SubstituirOpcoes`, `GET /cardapios/hoje/painel`, `PUT /cardapios/{id}/opcoes`, `PedidoResumoResponse` com itens e dados do pedido, e `UseStatusCodePages` com `detail` em português. 155 testes do backend passam (3 novos de domínio; a tabela de segurança de rotas ganhou as 2 rotas novas). Conferido contra o banco real numa API em outra porta: 401 com `detail`, painel 200, PUT em cardápio publicado 400 com a mensagem, id inexistente 404 e resumo com itens. O caminho "PUT em rascunho" só tem teste de domínio e de interface (não havia rascunho no banco real e não criei dados).
- Frontend: `lib`/`api` novos (`buscarCardapioDoPainel`, `alterarOpcoesDoCardapio`), `CardapioPage` com rascunho editável ("Salvar opções" e publicar travado até salvar), pedidos sem busca de detalhe, `cardapioGuardado.ts` e `usePedidoDetalhe` removidos, teste estático agora exige que nada use `localStorage`. 366 testes.
- Sobra: a conta `e2e-dois@teste.local` (superuser de teste) foi criada no banco por esta verificação, além das listadas em "Riscos e pendências".
