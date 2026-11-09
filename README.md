# KF Restaurante: frontend

Interface web do KF Restaurante em React. O **cliente** monta o pedido em `/` (sem login) e a **loja** gerencia tudo em `/loja` (com login, e cada pessoa vê e faz só o que as permissões dela liberam). Consome a API do repositório [KFRestaurante](https://github.com/karlosdevcs/KFRestaurante).

- Andamento e decisões tomadas durante a construção: [`PROGRESSO.md`](PROGRESSO.md)
- Spec que guiou o trabalho: [`spec-frontend/`](spec-frontend/00-indice.md)

## Como rodar

Pré-requisitos: Node.js 20 ou mais novo e a API rodando.

```bash
npm install
cp .env.example .env.local   # ajuste VITE_API_URL se a API não estiver em http://localhost:5000
npm run dev                  # http://localhost:5173
```

Abra `http://localhost:5173`: é a origem liberada no CORS do backend (`127.0.0.1` seria bloqueada). Se o front rodar em outro endereço, inclua-o em `Cors:OrigensPermitidas` no `appsettings.json` da API.

### Variáveis de ambiente

| Variável | Para que serve | Padrão |
|---|---|---|
| `VITE_API_URL` | Endereço da API, sem barra no final. Em produção use `https://` (o token da loja viaja no cabeçalho `Authorization`) | `http://localhost:5000` |

Toda variável `VITE_*` vai para o navegador e é **pública**. Nunca coloque segredo, chave de JWT, senha ou token aqui nem em `.env` commitado (`.env.local` está no `.gitignore`).

### O que fazer no backend para o login funcionar

A API **não sobe** sem a chave do JWT, e o primeiro superuser nasce da configuração local, não de um cadastro. No projeto da API (veja o README dele):

```bash
dotnet user-secrets set "Jwt:Chave" "<texto aleatório com 32+ caracteres>"
dotnet user-secrets set "Seed:Superuser:Nome" "Seu Nome"
dotnet user-secrets set "Seed:Superuser:Email" "voce@exemplo.com"
dotnet user-secrets set "Seed:Superuser:Senha" "uma senha com 8+ caracteres"
dotnet run --launch-profile KFRestaurante   # só esse perfil carrega o user-secrets
```

Com a API no ar, entre em `http://localhost:5173/loja/entrar` com esse e-mail e senha e crie as outras contas em **Usuários**. Cinco erros seguidos de senha bloqueiam a conta por 15 minutos; quem gerencia a pessoa redefine a senha (e isso também destrava).

### Scripts

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (porta 5173) |
| `npm run build` | Confere os tipos e gera o build de produção |
| `npm run preview` | Serve o build de produção localmente |
| `npm run lint` | oxlint |
| `npm test` | Vitest (uma execução) |
| `npm run test:watch` | Vitest em modo observação |

Em desenvolvimento existe o catálogo de componentes em `/_ui` (cada átomo em cada estado). Ele não entra no build de produção.

## Mapa de rotas

**Cliente (públicas, sem login e sem enviar token)**

| Rota | Celular | Computador |
|---|---|---|
| `/` | Cardápio (tela 1) | Página única: filtros, produto, acompanhamentos e carrinho lateral com o formulário |
| `/montar/:tamanhoId` | Montar marmita (tela 2) | Redireciona para `/?tamanho=:tamanhoId` |
| `/pedido` | Meu pedido e formulário (tela 3) | Redireciona para `/` |
| `/confirmacao/:numero` | Confirmação (tela 4) | Confirmação em página inteira, centralizada |

**Loja** (todo o bloco `/loja/*` é carregado sob demanda: o cliente não baixa o painel nem a lógica de login)

| Rota | Acesso | O que abre |
|---|---|---|
| `/loja/entrar` | pública | Login. Com sessão válida, vai para a primeira aba permitida |
| `/loja` | logado | Vai para a primeira aba permitida; sem nenhuma, mostra "Você ainda não tem acesso a nada por aqui" |
| `/loja/pedidos` | `VerPedidos` | Pedidos de hoje |
| `/loja/hoje` | `AbrirFecharLoja`, `EsgotarOpcoes` ou `AlterarWhatsApp` | Estado da loja, WhatsApp e "Acabou alguma coisa?" |
| `/loja/cardapio` | `GerenciarCardapio` | Cardápio do dia |
| `/loja/cadastros` | `GerenciarCadastros` | Opções, tamanhos e limites |
| `/loja/usuarios` | papel `Dono` ou `Superuser` | Usuários |
| `/loja/conta` | logado | Minha conta (trocar a própria senha) |
| `*` | pública | "Página não encontrada" |

### Abas e blocos por permissão

| Permissão (valor da API) | Rótulo | O que libera na tela |
|---|---|---|
| `VerPedidos` | Ver pedidos | Aba **Pedidos** |
| `EsgotarOpcoes` | Marcar esgotado | Coluna "Acabou alguma coisa?" (Pedidos, computador) e o bloco na aba **Hoje** |
| `AbrirFecharLoja` | Abrir e fechar a loja | Botão do selo no cabeçalho e cartão de status na aba **Hoje** |
| `AlterarWhatsApp` | Alterar o WhatsApp da loja | Cartão "WhatsApp da loja" na aba **Hoje** |
| `GerenciarCardapio` | Montar e publicar o cardápio | Aba **Cardápio** |
| `GerenciarCadastros` | Gerenciar opções e tamanhos | Aba **Cadastros** |
| papel `Dono` ou `Superuser` | | Aba **Usuários** |

A aba **Hoje** aparece com pelo menos uma de `AbrirFecharLoja`, `EsgotarOpcoes` ou `AlterarWhatsApp`, e dentro dela cada bloco respeita a sua permissão. O que a pessoa não pode usar é **escondido**, não desabilitado. A exceção é o selo de loja aberta ou fechada, que qualquer usuário logado vê (sem ser clicável quando falta `AbrirFecharLoja`).

Os papéis só definem hierarquia: `Funcionario` < `Dono` < `Superuser`. O superuser cria qualquer papel e tem todas as permissões; o dono cria só funcionários e só concede permissão que ele mesmo tem; ninguém desativa a si mesmo.

## Decisões importantes

**O token fica em `sessionStorage`, não em `localStorage`.** O token JWT é um segredo que o JavaScript consegue ler. No `localStorage` ele ficaria disponível a qualquer aba, por tempo indefinido, e um ataque XSS o levaria embora. No `sessionStorage` ele sobrevive a recarregar a página e morre ao fechar a aba. O custo, no tablet do balcão, é entrar de novo ao reabrir o navegador. O token nunca vai para a URL, para log nem para mensagem de erro, e só é enviado nas chamadas da área da loja (as do cliente nunca levam `Authorization`). Ao sair, a sessão e todo o cache do TanStack Query são limpos, para que nada da loja apareça para a próxima pessoa. O token dura 12 horas e não há refresh: ao vencer, a pessoa volta ao login com um aviso.

**O front esconde, mas quem protege é a API.** Esconder um botão não impede ninguém de chamar o endpoint. A permissão de cada pessoa vem do banco a cada requisição, e o front a lê com `GET /auth/eu` (ao abrir, ao voltar o foco, a cada 60 segundos e depois de qualquer 403). O front só evita oferecer o que a API vai recusar, por clareza. Um 401 desloga com a mensagem de sessão expirada; um 403 mostra a mensagem e não desloga.

**`Gerado` e `Enviado`.** O sistema não enxerga o WhatsApp. `Gerado` é o pedido que a API registrou e que o cliente ainda não tocou em "Enviar no WhatsApp" (aparece como "Não enviado"). `Enviado` significa só que o cliente tocou no botão, **não** que a mensagem saiu. A tela não promete mais do que isso.

**A mensagem do WhatsApp vem pronta da API.** `POST /pedidos` devolve `mensagemWhatsApp` e `linkWhatsApp`. O front mostra o texto exatamente como veio (texto puro, nunca HTML) e abre o link. Assim o formato da mensagem tem um dono só, o backend, e qualquer mudança nele não exige mexer aqui. O botão "Enviar no WhatsApp" é um `<a href target="_blank">` de verdade para o navegador não bloquear a abertura; o aviso de "enviado" é disparado no clique, sem esperar, e se falhar o link abre do mesmo jeito.

**O formulário de finalização fica dentro do carrinho lateral no computador.** O protótipo do computador não tinha formulário. Em vez de abrir uma janela ou outra página, ele fica abaixo da lista de itens, com os mesmos campos, ordem, validações e componentes do celular (é literalmente o mesmo componente). A pessoa vê o pedido e os dados juntos e confirma sem trocar de tela.

**O layout é escolhido por código, não por quebra de CSS.** Um hook (`useIsDesktop`, breakpoint de 1024px) decide qual layout renderizar. Celular e computador têm estruturas diferentes (quatro telas contra uma página única), então não são o mesmo layout esticado.

**Pedidos já feitos guardam a foto do preço.** Mudar o preço de uma opção ou de um tamanho vale dali em diante; o `ItemDoPedido` grava nome e preço do momento da compra.

**Outras:** React 18 (é o que a spec pede, em vez do React 19 do template atual do Vite), Tailwind v4 com os tokens de design como variáveis CSS, TanStack Query para dados do servidor e `Context` + reducer para o carrinho (sem Redux). Todas as decisões de detalhe, com o motivo, estão em [`PROGRESSO.md`](PROGRESSO.md).

## Estrutura

```
src/
  api/          client (ProblemDetails, 401, 403), tipos dos DTOs e um arquivo por recurso
  components/ui/  átomos (botões, campos, abas, diálogo, selos...), sem regra de negócio
  features/
    auth/       sessão, login, guardas de rota, hooks de permissão
    cliente/    carrinho, telas do celular, página única do computador, confirmação
    loja/       casca, abas (pedidos, hoje, cardapio, cadastros, usuarios) e Minha conta
    catalogo/   catálogo /_ui (só em desenvolvimento)
  lib/          regras puras e testadas: marmita, carrinho, formulário, formatação, permissões
  styles/       tokens de design e base global
  test/         servidor MSW, fixtures e ajudantes dos testes
```

## Testes

`npm test` roda o Vitest com Testing Library e MSW (a API é simulada com os contratos do backend; nenhuma chamada sai para a rede). Cobre as regras da marmita, a validação e o payload do pedido, login e sessão, 401 e 403, permissões por aba e bloco, gestão de usuários, os fluxos do cliente, o cardápio da loja, os estados de erro, o foco e os títulos de página, e um teste estático das regras de segurança (sem `dangerouslySetInnerHTML`, links externos com `rel="noopener noreferrer"`, token só no `sessionStorage`).

## Limitações conhecidas

Fora desta versão, de propósito:

- Refresh token e "lembrar de mim" por mais de 12 horas (a API não tem: o token dura 12 horas)
- Criação de superuser pela interface (só pela configuração do backend)
- Notificação push, som ou WebSocket de pedido novo (só polling: a lista de pedidos atualiza a cada 30 segundos)
- Upload de foto de prato (a ilustração e as bolinhas coloridas por categoria são placeholders)
- Exclusão de opções, tamanhos, cardápios e usuários (a API não tem exclusão; só desativar usuário)
- Troca de fundo ou tema, e busca de pratos
- Integração com a API oficial do WhatsApp (só o link `wa.me` que a API devolve)
- Recuperação de senha por e-mail (quem gerencia a pessoa redefine a senha dela)
- Porção dupla de um componente na marmita (a API aceita, a tela tem só o liga e desliga)

Antes de expor a API na internet, o backend precisa de HTTPS e de limite de tentativas no login.

## Lacunas do backend encontradas

As três lacunas que o front contornava foram tratadas no backend (e o front passou a usar o que o backend oferece agora):

1. **Rascunho de cardápio.** Agora existe `GET /cardapios/hoje/painel` (o cardápio de hoje em qualquer situação, para quem tem `GerenciarCardapio`) e `PUT /cardapios/{id}/opcoes` (troca as opções de um rascunho). O painel não guarda mais id no navegador e deixa trocar as opções antes de publicar.
2. **`GET /pedidos` sem itens.** A lista de pedidos agora traz itens, endereço, referência, observação e troco. O painel não faz mais uma chamada por pedido.
3. **Mensagens de 401 e 403.** A API agora manda `detail` em português nesses erros.

Continua como está, de propósito:

- `GET /pedidos/{id}` exige `VerPedidos`. Abri-lo ao cliente deixaria qualquer pessoa ler pedidos de outras (nome, telefone, endereço) só trocando o número na URL. Por isso a confirmação usa a resposta do `POST /pedidos`, guardada em `sessionStorage` para sobreviver a um recarregamento acidental.
- A API não tem exclusão de opções, tamanhos, cardápios, usuários nem pedidos (pedido é histórico; só desativar usuário).
