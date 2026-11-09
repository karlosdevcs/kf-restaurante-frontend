# KF Restaurante, spec do frontend (parte 4 de 9): Login, sessão e permissões

Ler primeiro o `00-indice.md`. Esta parte faz parte de uma spec dividida em arquivos; as referências a "seção N" apontam para o número da seção, e o índice diz em qual arquivo cada seção está.

## 10. Login, sessão e permissões

A proteção real está na **API**, não na tela: esconder um botão no front não impede ninguém de chamar o endpoint. O front esconde o que a pessoa não pode usar por clareza, e trata 401 e 403 quando a API recusar.

### 10.1 Tela de login (`/loja/entrar`)
- **Desktop:** fundo `canvas`, cartão branco centralizado (`max-width 400`, raio 28, `padding 32`, sombra da seção 4). **Celular:** página branca, `padding 24`, conteúdo alinhado ao topo com 48 de margem.
- Conteúdo (gap 16): Logo (34); título "Entrar" (24/800) e abaixo "Área da loja" (14 `muted`); campo **E-mail** (`h 46`, `type="email"`, `autoComplete="username"`); campo **Senha** (com "Mostrar"/"Ocultar"); `Banner` de erro quando houver; botão `primary-ink` "Entrar" (`h 52`, largura total); linha de apoio (13 `muted`, centralizada): "Esqueceu a senha? Peça ao dono da loja para redefinir."
- Validação no cliente: e-mail com formato válido e senha não vazia. **Não** exigir tamanho mínimo da senha no login (quem valida é a API).
- Ao enviar: `POST /auth/login` com `{ email, senha }`. O e-mail pode ir com `trim`. Desabilitar o botão e mostrar "Entrando...". Após falha, **limpar o campo de senha** e manter o e-mail.
- Resposta 200: `{ token, expiraEm, usuario }`. Guardar a sessão (seção 10.2) e navegar para a rota que a pessoa tentou abrir antes (se houver) ou para a primeira aba permitida (10.5).
- Erro 401: mostrar o `detail` que a API devolver ("E-mail ou senha inválidos, ou acesso bloqueado."). A mensagem é a mesma para e-mail inexistente, senha errada, conta inativa e conta bloqueada, de propósito: **o front não pode tentar distinguir esses casos** nem dar dicas.
- Informação útil para o texto de ajuda do README (e não da tela): 5 erros seguidos bloqueiam a conta por 15 minutos.
- Outros erros (rede, 500): "Não foi possível entrar agora. Tente de novo." (a mensagem de rede não deve dizer se o e-mail existe).
- Não existe cadastro público. O primeiro superuser é criado pela configuração do backend.

### 10.2 Sessão e token
- A API usa JWT (Bearer) no cabeçalho `Authorization`. O token carrega só o id do usuário; **papel e permissões são lidos do banco a cada requisição**. O token dura 12 horas e não há refresh. Não há cookie: o CORS não permite credenciais.
- **Onde guardar:** em memória (estado do `AuthProvider`) e espelhado em `sessionStorage` (chave `kf:sessao`, com `token` e `expiraEm`), para sobreviver a recarregar a página e morrer ao fechar a aba. Não usar `localStorage`. (Motivo: o token é um segredo acessível por JavaScript; um ataque XSS leria o `localStorage` de qualquer aba e por muito tempo. Para o tablet do balcão, o custo é entrar de novo ao reabrir o navegador. Registrar essa decisão no README.)
- **Nunca** colocar o token na URL, em log, em mensagem de erro, ou no estado global exposto às ferramentas de desenvolvimento em produção.
- Só enviar o cabeçalho `Authorization` nas chamadas da área da loja. O client de API recebe um parâmetro `auth: true` nas rotas protegidas. As chamadas do cliente (cardápio, tamanhos, restaurante, pedido) nunca levam token.
- **Ao abrir qualquer rota `/loja/*`:**
  1. Sem sessão guardada, ou com `expiraEm` já passado: ir para `/loja/entrar`.
  2. Com sessão: chamar `GET /auth/eu` e só então renderizar. Enquanto responde, mostrar o esqueleto do cabeçalho (sem abas).
  3. `GET /auth/eu` devolve `UsuarioResponse` (`id`, `nome`, `email`, `papel`, `ativo`, `permissoes`): **é a fonte de verdade de quem é a pessoa e do que ela pode fazer.**
- **Atualizar permissões durante o uso:** refazer `GET /auth/eu` quando a janela voltar a ter foco, a cada 60 segundos enquanto a aba estiver visível e depois de qualquer resposta 403. Se as permissões mudarem, as abas se ajustam sozinhas; se a aba atual deixar de ser permitida, ir para a primeira permitida (ou para a tela "sem acesso", 10.5).
- **Expiração:** agendar um aviso no horário de `expiraEm` (UTC). Ao vencer, limpar a sessão e ir para `/loja/entrar` com a mensagem "Sua sessão expirou. Entre de novo." Não tentar renovar.
- **Sair:** limpar `sessionStorage`, limpar todo o cache do TanStack Query (nada de dados da loja pode sobrar na tela seguinte) e ir para `/loja/entrar`. Não existe endpoint de logout (o token simplesmente deixa de ser usado).

### 10.3 401 e 403 (`ProblemDetails`)
Toda chamada protegida sem token, com token inválido ou vencido, ou de usuário inativo volta **401**. Com token válido mas sem a permissão (ou sem a hierarquia) volta **403**. Os dois saem no formato `ProblemDetails` (campos `status`, `title` e, quando a API explica, `detail`). O client de API deve:
- Ler o corpo como `ProblemDetails` e expor `status`, `title` e `detail`; a mensagem para a tela é `detail` e, se não houver, `title`.
- **401** em chamada protegida (exceto o `POST /auth/login`): limpar a sessão e ir para `/loja/entrar` com "Sua sessão expirou. Entre de novo." (cobre também o caso da pessoa ter sido desativada).
- **403:** mostrar `Banner` de erro "Você não tem permissão para fazer isso." (usar o `detail` quando a API trouxer um, por exemplo "Você não pode conceder permissões que não possui: ..."), e refazer `GET /auth/eu`. Não deslogar.
- Nunca mostrar `alert`, e nunca deixar a tela em branco.

### 10.4 Permissões e papéis
- **Permissões** (a API devolve como texto; cada uma liga uma capacidade e é independente das outras):

| Valor da API | Rótulo na tela | O que libera |
|---|---|---|
| `VerPedidos` | Ver pedidos | Aba Pedidos; `GET /pedidos` e `GET /pedidos/{id}` |
| `EsgotarOpcoes` | Marcar esgotado | `PATCH /opcoes/{id}/esgotado` |
| `AbrirFecharLoja` | Abrir e fechar a loja | `POST /restaurante/abrir` e `/fechar` |
| `GerenciarCardapio` | Montar e publicar o cardápio | Aba Cardápio; `/cardapios` |
| `GerenciarCadastros` | Gerenciar opções e tamanhos | Aba Cadastros; `POST` e `PUT` de opções e tamanhos, e os limites |
| `AlterarWhatsApp` | Alterar o WhatsApp da loja | `PUT /restaurante/whatsapp` |

- **Papéis** (só definem hierarquia, não o que a pessoa faz): `Funcionario` (rótulo "Funcionário") < `Dono` ("Dono") < `Superuser` ("Superuser"). Superuser tem todas as permissões sempre (a API já devolve a lista completa).
- **Rótulos vêm de um mapa em `lib/permissoes.ts`**, indexado pelo valor da API. Um valor desconhecido (permissão nova que o backend acrescentar) deve aparecer com o próprio nome técnico, sem quebrar a tela.
- Hooks e componentes: `usePermissao(valor)`, `usePermissoes()`, `useEhGestor()` (papel `Dono` ou `Superuser`) e `<Pode permissao="VerPedidos">...</Pode>`.
- **Regra de apresentação:** o que a pessoa não pode usar é **escondido**, não desabilitado. A exceção é informação inofensiva que ajuda a entender a tela, por exemplo o selo de loja aberta ou fechada, que aparece para qualquer usuário logado (sem ser clicável quando falta `AbrirFecharLoja`).

### 10.5 Quais abas aparecem
| Aba | Aparece quando o usuário tem |
|---|---|
| Pedidos | `VerPedidos` |
| Hoje | pelo menos uma entre `AbrirFecharLoja`, `EsgotarOpcoes`, `AlterarWhatsApp` |
| Cardápio | `GerenciarCardapio` |
| Cadastros | `GerenciarCadastros` |
| Usuários | papel `Dono` ou `Superuser` |

- Ordem fixa: Pedidos, Hoje, Cardápio, Cadastros, Usuários. "Minha conta" fica no `UserMenu`, não é aba.
- A primeira aba permitida, nessa ordem, é o destino padrão depois do login e de `/loja`.
- **Funcionário sem nenhuma permissão:** nenhuma aba. Mostrar, no corpo, o cartão "Você ainda não tem acesso a nada por aqui" com o texto "Peça ao dono da loja para liberar as suas permissões." e, em baixo, "Minha conta" e "Sair". Não é um erro.
- Dentro de uma aba, cada bloco também respeita a permissão (por exemplo, a coluna "Acabou alguma coisa?" da aba Pedidos só aparece com `EsgotarOpcoes`).
