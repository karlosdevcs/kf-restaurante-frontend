# PROGRESSO: execução da spec do frontend

Se a sessão for interrompida ou compactada: **releia este arquivo e `spec-frontend/00-indice.md`** e continue da fase marcada como "em andamento".

- Spec: `spec-frontend/` (cópia da pasta recebida; ler primeiro `00-indice.md`). Plano de fases: seção 20, em `spec-frontend/09-textos-testes-entrega.md`.
- Raiz do projeto: esta pasta (`kf-restaurante-frontend`), repositório separado do backend. A spec fala em `frontend/` dentro de um monorepo; o usuário decidiu por repositórios separados, então `frontend/` = esta raiz.
- Backend lido: `main` no commit `c5bad65`, o mesmo que a spec leu.

## Fase atual

**Fase 4: cliente celular** (em andamento)

## Fases concluídas

| Fase | Commit | O que entrou |
|---|---|---|
| 1. Projeto base | `afbc430` | Vite, TypeScript strict, Tailwind v4 com tokens, Inter auto-hospedada, rotas vazias (`/loja/*` lazy), client de API com `ProblemDetails`/401/403, 1 arquivo por recurso (33 rotas), TanStack Query, Vitest + MSW (14 testes), `.env.example` |
| 2. Átomos e catálogo `/_ui` | `1c56700` | 20 átomos em `components/ui/` com as medidas da seção 8 (Logo, Button/LinkButton, FilterPill, TopNavPill, SizeButton, ChoiceButton, SizeCard, IngredientTile, Stepper, LineStepper, Field/PasswordField/TextAreaField, ListCheckbox, Banner, Chip, Dialog, ClientStatusBadge, OrderStatusPill, StatusButton, AvailabilityToggle, Tabs, BottomTabBar, MarmitaIllustration), ícones SVG, `lib/` (categoriaConfig, formatar, statusPedido, useIsDesktop), catálogo `/_ui` só em dev, 120 testes |
| 3. Autenticação | (hash no commit seguinte) | `AuthProvider` (só dentro de `/loja`), login `/loja/entrar`, sessão em `sessionStorage`, guardas `RequerSessao`/`RequerAba`, `GET /auth/eu` (foco, 60 s, após 403), expiração por horário, `UserMenu`, `LojaLayout` com abas por permissão, `SemAcesso`, `ContaPage` (trocar senha), `lib/permissoes.ts`, hooks `useSessao`/`usePermissao`/`usePermissoes`/`useEhGestor` e `<Pode>`; testes 7, 8 e 9 (33 novos, 153 no total) |

## Divergências encontradas (spec x código)

O código do backend vence a spec; cada divergência é registrada aqui.

| # | Onde | Spec diz | Código diz | O que foi feito |
|---|---|---|---|---|
| (nenhuma até aqui) | | | | |

Conferido na fase 0: as 33 rotas da seção 13 batem com as 33 de `EndpointsProtegidosTests` (7 abertas, 4 "logado", 7 de usuários, 15 por permissão).

## Lacunas do backend

Nada do backend é alterado. Cada lacuna entra aqui com a mitigação adotada no front.

| # | Lacuna | Mitigação no front |
|---|---|---|
| (nenhuma até aqui) | | |

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
| 12 | `src/features/Pendente.tsx` é uma tela provisória das fases 1 a 3 | Rotas vazias da fase 1; será removida quando cada rota ganhar sua tela |
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

## Riscos e pendências de entrega

- A pasta `referencia-conceito2/` (os 4 protótipos `.dc.html`) **não foi encontrada** na máquina nem dentro do `spec-frontend.zip`. A spec manda tratá-los só como leitura de medidas; a spec já traz tokens, medidas e textos. Se alguma medida faltar, vale a spec e o caso fica registrado aqui. Entregável 3 da seção 21 (colocar os 4 arquivos em `referencia-conceito2/`) fica **pendente**: o usuário precisa fornecê-los.

## Critérios de aceite (seção 20)

Conferidos só ao final da fase 11.
