# PROGRESSO: execução da spec do frontend

Se a sessão for interrompida ou compactada: **releia este arquivo e `spec-frontend/00-indice.md`** e continue da fase marcada como "em andamento".

- Spec: `spec-frontend/` (cópia da pasta recebida; ler primeiro `00-indice.md`). Plano de fases: seção 20, em `spec-frontend/09-textos-testes-entrega.md`.
- Raiz do projeto: esta pasta (`kf-restaurante-frontend`), repositório separado do backend. A spec fala em `frontend/` dentro de um monorepo; o usuário decidiu por repositórios separados, então `frontend/` = esta raiz.
- Backend lido: `main` no commit `c5bad65`, o mesmo que a spec leu.

## Fase atual

**Fase 2: átomos de `components/ui/` e catálogo `/_ui`** (em andamento)

## Fases concluídas

| Fase | Commit | O que entrou |
|---|---|---|
| 1. Projeto base | (hash no commit seguinte) | Vite, TypeScript strict, Tailwind v4 com tokens, Inter auto-hospedada, rotas vazias (`/loja/*` lazy), client de API com `ProblemDetails`/401/403, 1 arquivo por recurso (33 rotas), TanStack Query, Vitest + MSW (14 testes), `.env.example` |

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

## Riscos e pendências de entrega

- A pasta `referencia-conceito2/` (os 4 protótipos `.dc.html`) **não foi encontrada** na máquina nem dentro do `spec-frontend.zip`. A spec manda tratá-los só como leitura de medidas; a spec já traz tokens, medidas e textos. Se alguma medida faltar, vale a spec e o caso fica registrado aqui. Entregável 3 da seção 21 (colocar os 4 arquivos em `referencia-conceito2/`) fica **pendente**: o usuário precisa fornecê-los.

## Critérios de aceite (seção 20)

Conferidos só ao final da fase 11.
