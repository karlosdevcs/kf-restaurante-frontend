# KF Restaurante, spec do frontend (parte 1 de 9): Base do projeto: stack, tokens, tipografia, ícones, layout e rotas

Ler primeiro o `00-indice.md`. Esta parte faz parte de uma spec dividida em arquivos; as referências a "seção N" apontam para o número da seção, e o índice diz em qual arquivo cada seção está.

## 3. Stack, estrutura e scripts

**Stack**
- React 18, TypeScript (strict), Vite
- Tailwind CSS (a versão que o template atual do Vite suportar; expor os tokens da seção 4 pelo mecanismo dessa versão)
- React Router (rotas da seção 7)
- TanStack Query para dados do servidor (cache, polling, estados de carregamento e erro, invalidação depois de mutação)
- Fonte Inter auto-hospedada com `@fontsource-variable/inter` (sem Google Fonts em produção)
- Testes: Vitest, React Testing Library, MSW (seção 18)
- Sem Redux. Estado do carrinho e do formulário em Context + reducer, local ao fluxo do cliente. Sessão da loja em um `AuthProvider`.

**Local do projeto:** pasta `frontend/` na raiz deste repositório (monorepo), a menos que eu diga outra coisa.

**Estrutura sugerida**
```
frontend/
  referencia-conceito2/        (os 4 .dc.html, só leitura)
  src/
    api/                       client central + 1 arquivo por recurso, tudo tipado
    auth/                      AuthProvider, useSessao, usePermissao, guardas de rota, armazenamento do token
    components/ui/             átomos: Logo, Button, Pill, FilterPill, Stepper, IngredientTile, Field, Banner, Dialog, Tabs...
    components/                compostos compartilhados
    features/cliente/          telas e hooks do fluxo do cliente
    features/loja/             telas e hooks do painel (pedidos, hoje, cardapio, cadastros, usuarios, conta)
    lib/                       formatBRL, formatData, telefone, regrasMarmita, rotulos, categoriaConfig, permissoes
    styles/                    tokens e base
    routes.tsx
  .env.example
  README.md
```

**Variáveis de ambiente (`.env.example`)**
- `VITE_API_URL` (ex.: `http://localhost:5000`). Em produção, `https://`, porque o token viaja no cabeçalho.
- Nada mais. O número do WhatsApp da loja **não** é variável do front: a API já devolve o link pronto (seção 13).
- **Variáveis `VITE_*` vão para o navegador e são públicas.** Nunca colocar segredo nelas.

**Scripts:** `dev` (porta 5173, a primeira liberada no CORS do backend), `build`, `preview`, `lint`, `test`. Se o front for servido de outro endereço, esse endereço precisa entrar em `Cors:OrigensPermitidas` no `appsettings.json` do backend (avisar, não alterar).

## 4. Design tokens

Definir como variáveis CSS em `:root` e expor ao Tailwind. Nada de cor solta no código: todo hex usado nos componentes sai daqui.

| Token | Valor | Uso |
|---|---|---|
| `brand` | `#D6381F` | cor de marca, preços, botões de ação, aba ativa, "+" |
| `brand-strong` | `#B3241B` | texto vermelho sobre fundo claro-vermelho (contraste, ver seção 15) |
| `brand-hover` | `#AE2C18` | hover do botão vermelho |
| `brand-tint` | `#FCEAE6` | fundo de pílula/filtro ativo, situação do cardápio, caixa de erro |
| `ink` | `#16181D` | texto principal, botões escuros, borda de seleção |
| `ink-hover` | `#2A2D35` | hover do botão escuro |
| `muted` | `#6B707A` | texto secundário (aprovado para texto pequeno) |
| `subtle` | `#8A8F98` | só placeholder e elementos decorativos (não usar em texto informativo, ver seção 15) |
| `line` | `#E7E9ED` | borda de controles |
| `line-soft` | `#EEF0F3` | divisórias e bordas de cartão |
| `line-row` | `#F0F1F3` / `#F3F4F6` | divisórias de lista (mobile `#F0F1F3`, tabela web `#F3F4F6`) |
| `surface` | `#F7F8FA` | fundo de cartão cinza, inputs, linhas do carrinho |
| `canvas` | `#F1F2F5` | fundo atrás do cartão branco, botão de passo do stepper |
| `disabled-bg` / `disabled-fg` | `#EEF0F3` / `#B9BEC7` | botão desabilitado |
| `blocked` | `#C2C6CC` | texto de item esgotado ou bloqueado |
| `success` | `#1E8A4C` | bolinha de "aberto", ícone de sucesso |
| `success-text` | `#187A42` | texto verde sobre claro e botão verde do WhatsApp (contraste) |
| `success-bg` | `#EAF7EE` | selo "Aberto", ícone de sucesso, caixa de sucesso |
| `success-line` | `#BFD9C8` | borda do botão "Disponível" |
| `warn-bg` / `warn-text` | `#FCECC6` / `#8A5A00` | selo "Não enviado" |
| `warn-row` | `#FFFBF0` | fundo da linha de pedido não enviado (tabela web) |
| `status-neutral-bg` / `-fg` | `#F1F2F5` / `#4A525E` | selo "Enviado", selo "Inativo" |
| `tile-selected-bg` | `#FBF2E4` | fundo do ingrediente marcado |
| `illustration-bg` | `#F7F2EC` | painel da ilustração da marmita |
| `dash` | `#DEE1E6` | linha tracejada acima do total |
| `overlay` | `rgba(22,24,29,0.45)` | fundo atrás de um diálogo |

**Cores de categoria** (bolinha/ícone no lugar de foto): Carne `#F3D8CF`, Acompanhamento `#FBE7B8`, Guarnição `#E6D9C2`, Salada `#D8E8CB`, Bebida `#D7E6F2`, Sobremesa `#F2D9E8`. O item do carrinho usa sempre `#F3D8CF`.

**Raios:** cartão do app desktop 28, painel da ilustração 24, cartão de login 28, diálogo 20, cartões grandes 16, tiles 14, botões de escolha 12, botões de tamanho 10, pílulas e botões principais `9999px`.

**Sombra (só o cartão grande do desktop do cliente e o cartão de login):** `0 20px 50px rgba(20,22,28,0.08)`. Nenhuma outra sombra no sistema.

**Movimento:** transição de 150ms só em cor, borda e fundo. Sem animação de entrada. Respeitar `prefers-reduced-motion`.

**Estados de interação (o protótipo não os mostra, definir assim)**
- Hover: botão escuro vai a `ink-hover`; vermelho vai a `brand-hover`; botão contornado e pílula inativa ganham fundo `surface`.
- Foco visível: anel de 2px `ink` com offset de 2px em todo elemento interativo. Nunca remover o outline sem substituto.
- Pressionado: mesmo visual do hover, sem escala.
- Desabilitado: `disabled-bg`/`disabled-fg` nos botões; texto `blocked` nos tiles; `cursor: not-allowed`.

## 5. Tipografia

Inter, pesos 400 a 800. Sem `text-transform` exceto o cabeçalho da tabela da loja.

| Uso | Tamanho / peso |
|---|---|
| Logo (computador) | 19 / 800, letter-spacing -0.3px (cabeçalho da loja web: 18) |
| Logo (celular cliente) | 16 / 800, -0.3px (celular loja: 15) |
| Título de produto "Marmita M" (desktop) | 28 / 800, line-height 1.15 |
| Título de tela da loja (web) | 24 / 800 |
| Título de tela (celular loja) | 22 / 800 |
| Título de tela cliente celular (montar, meu pedido) | 24 / 800 |
| Título de confirmação | 26 / 800, line-height 1.2 |
| Título do login | 24 / 800 |
| Título de seção grande | 18 / 700 (desktop "Categoria da marmita"); 16 / 700 ("Monte sua marmita", "Hoje tem", "Pra acompanhar") |
| Título de grupo de ingredientes (celular) | 15 / 700 |
| Texto de corpo | 14 / 400, line-height 1.5 em parágrafo |
| Nome em linha de lista | 14 a 15 / 600 |
| Preço | 13 a 15 / 700, cor `brand` |
| Legenda e rótulo pequeno | 11 a 13 / 400 a 600, cor `muted` |
| Rótulo de campo (label) | 13 / 600, `muted` (celular cliente e login) ou 14 / 700 (formulários da loja) |
| Rótulo de seção em caixa alta ("TAMANHO", "MONTE SUA MARMITA") | 12 / 700, letter-spacing 0.5px, `muted` |
| Botão principal | 15 / 700 (desktop confirmar: 16 / 700) |
| Total do carrinho | 20 / 800 (desktop), 26 / 800 (celular) |

## 6. Ícones e ilustração

Todos SVG inline, traço `currentColor`, `stroke-linecap="round"`, `stroke-linejoin="round"`, `aria-hidden="true"` quando decorativos. Sem biblioteca de ícones.

- **Logo (garfo e faca)**, `viewBox="0 0 24 24"`, `fill="none"`, traço branco 2:
  - `M7 3v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3M4 11v10M7 3v7M5.5 3v5`
  - `M17 3c-1.7 0-3 2.1-3 5.5S15.3 14 17 14s3-2.1 3-5.5S18.7 3 17 3z`
  - `M17 14v7`
- **Check:** `M5 12l5 5 9-10` (traço 3 a 4 conforme o tamanho)
- **Seta voltar:** `M15 6l-6 6 6 6` (traço 2.5)
- **WhatsApp:** `M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.6-5.2A8.5 8.5 0 1 1 21 11.5z` (traço 2)
- **Filtro (desktop):** `M4 6h16M7 12h10M10 18h4` (traço 2, cor `#B9BEC7`)
- **Olho e olho riscado (mostrar e ocultar senha):** criar no mesmo estilo de traço.
- **Mais e menos dos botões de quantidade:** caracteres `+` e `−` ou SVG equivalente, sempre com `aria-label`.

**Ilustração da marmita** (painel do produto no desktop, 220x154): componente `MarmitaIllustration`, `viewBox="0 0 200 140"`:
```
<rect x="8" y="10" width="184" height="120" rx="20" fill="#FFFFFF" stroke="#16181D" stroke-width="3"/>
<path d="M100 14v112M100 70h88" stroke="#16181D" stroke-width="2.5"/>
<rect x="16" y="18" width="80" height="104" rx="12" fill="#FBF2E4"/>
<path d="M30 40l8 4M54 36l8 3M38 62l8 3M62 58l8 4M30 86l8 3M52 82l8 4M70 100l8 3M36 106l8 3" stroke="#D8BE8E" stroke-width="4" stroke-linecap="round"/>
<circle cx="122" cy="36" r="8" fill="#B0552B"/><circle cx="144" cy="46" r="8" fill="#B0552B"/><circle cx="166" cy="34" r="8" fill="#B0552B"/><circle cx="132" cy="56" r="6" fill="#B0552B"/><circle cx="170" cy="54" r="6" fill="#B0552B"/>
<path d="M112 116c-6-18 12-32 34-28 20 4 34 18 26 30-9 10-48 12-60-2z" fill="#E4A94A" stroke="#16181D" stroke-width="3"/>
```
É um placeholder até existirem fotos reais. Isolar num componente para trocar depois sem mexer nas telas.

## 7. Layout, breakpoints e rotas

**Duas áreas, um só app.** Os mesmos componentes servem celular e computador.

**Breakpoints**
- Celular: menor que 1024px. Fluxo em telas (cliente) e barra de abas no rodapé (loja). Em 600px ou mais, centralizar o conteúdo com `max-width: 480px`.
- Computador: 1024px ou mais. Cliente em página única com carrinho lateral; loja com abas no topo.
- Usar o breakpoint fixo de 1024px (hook `useIsDesktop` com `matchMedia`) para escolher o layout. Não depender de `flex-wrap` para quebrar.

**Rotas do cliente (públicas, sem login)**
| Rota | Celular | Computador |
|---|---|---|
| `/` | Cardápio (tela 1) | Página única: filtros, produto, acompanhamentos e carrinho lateral |
| `/montar/:tamanhoId` | Montar marmita (tela 2) | Redireciona para `/?tamanho=:tamanhoId` |
| `/pedido` | Meu pedido e formulário (tela 3) | Redireciona para `/` (o formulário fica no carrinho lateral) |
| `/confirmacao/:numero` | Confirmação (tela 4) | Confirmação em página inteira (centralizada, max 680px) |

**Rotas da loja**
| Rota | Acesso | O que abre |
|---|---|---|
| `/loja/entrar` | pública | Tela de login. Se já houver sessão válida, redireciona para a primeira aba permitida |
| `/loja` | logado | Redireciona para a primeira aba permitida (seção 10.5) |
| `/loja/pedidos` | `VerPedidos` | Aba Pedidos |
| `/loja/hoje` | `AbrirFecharLoja`, `EsgotarOpcoes` ou `AlterarWhatsApp` | Aba Hoje |
| `/loja/cardapio` | `GerenciarCardapio` | Aba Cardápio |
| `/loja/cadastros` | `GerenciarCadastros` | Aba Cadastros |
| `/loja/usuarios` | papel `Dono` ou `Superuser` | Aba Usuários |
| `/loja/conta` | logado | Minha conta (trocar senha) |
| `*` | pública | Página simples "Página não encontrada" com link para `/` |

A URL é a fonte de verdade de qual tela está aberta, para o botão voltar do navegador funcionar. Todo o bloco `/loja/*` deve ser carregado de forma lazy (code splitting): o cliente não baixa o painel nem a lógica de login.

**Largura máxima**
- Cliente desktop: página com 28px de padding e fundo `canvas`; cartão branco com `max-width: 1180px`, raio 28, sombra da seção 4, `overflow: hidden`, centralizado.
- Loja desktop: fundo `canvas` na página toda; conteúdo `max-width: 1240px`, padding lateral 24.
- Login desktop: fundo `canvas`, cartão centralizado de `max-width: 400px`.
