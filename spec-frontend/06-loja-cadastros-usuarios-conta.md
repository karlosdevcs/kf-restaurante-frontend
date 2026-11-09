# KF Restaurante, spec do frontend (parte 6 de 9): Área da loja (2 de 2): Cadastros, Usuários e Minha conta

Ler primeiro o `00-indice.md`. Esta parte faz parte de uma spec dividida em arquivos; as referências a "seção N" apontam para o número da seção, e o índice diz em qual arquivo cada seção está.

### 11.4 Cadastros (`GerenciarCadastros`)
- Sub-abas **Opções** e **Tamanhos**. Web mostra as duas lado a lado (Opções flex 2, mínimo 440; Tamanhos flex 1, mínimo 260, gap 24). Celular usa duas `ChoiceButton` (40 de altura, raio 10) para alternar.
- `GET /opcoes` exige apenas estar logado, então a lista de opções vale para qualquer usuário da loja; criar e editar exigem `GerenciarCadastros`.

**Opções**
- Título "Opções" (24/800 web) e botão "Nova opção" (`primary-ink`, `h 40`, `px 16`, raio total).
- Lista: web em tabela (Nome, Categoria, Preço, Ações); celular em linhas com divisórias. Preço `brand` 700, ou "componente" em `muted` quando for nulo. Ação "Editar" em cada linha (botão `outline`, `h 36` visual e 44 de área de toque).
- Formulário (criar e editar; cartão com borda 1 `brand`, raio 14, padding 14 a 16, gap 8):
  - **Nome** (placeholder "Nome, ex.: Strogonoff").
  - **Categoria**: grade de `ChoiceButton` (web `auto-fill, minmax(110px, 1fr)`; celular 3 colunas, onde "Acompanhamento" aparece como "Acomp."). Categorias vêm do mapa `categoriaConfig`.
  - **Preço, regra do domínio:** `preco` é opcional e `nulo` quer dizer "só entra em marmita". **Bebida e Sobremesa exigem preço** (só são vendidas avulsas). Nas categorias de componente, o preço é opcional: mostrar uma caixa "Vender também avulsa" (checkbox) e, só quando marcada, o campo de preço. Isto é um acréscimo ao protótipo, necessário porque o backend permite componente com preço. Texto de apoio quando desmarcada: "Componente de marmita não tem preço próprio. Entra no preço do tamanho."
  - Preço aceita vírgula ou ponto; enviar número. Maior ou igual a zero.
  - Botões "Cancelar" (`outline`) e "Salvar opção" (`primary-ink`, desabilitado até o formulário ser válido).
- Criar: `POST /opcoes` com `{ nome, categoria, preco }`. Editar: `PUT /opcoes/{id}` com os mesmos campos. **409** (nome já existe): mostrar a mensagem abaixo do campo Nome. **400**: mensagem de domínio em `Banner`.
- Validação no cliente: nome obrigatório; preço obrigatório e maior ou igual a zero para Bebida e Sobremesa.

**Tamanhos**
- Um cartão por tamanho (web: borda `line-soft`, raio 14, padding `14 16`; celular: fundo `surface`, raio 14, padding 14): "Marmita {nome}" (18/800), preço 14 a 15/700 `brand`, "até N itens" e os limites por categoria (13 / 12 `muted`; ex.: "Carne: até 2"). Ação "Editar" em cada cartão e botão "Novo tamanho" no título.
- Formulário de tamanho: **Nome**, **Preço**, **Limite total de componentes** (inteiro maior ou igual a zero). `POST /tamanhos` com `{ nome, preco, limitedeComponente }` e `PUT /tamanhos/{id}` com os mesmos campos. 409 em nome duplicado; 400 em valor inválido.
- **Limites por categoria:** seção dentro do formulário de edição, uma linha por categoria de componente (Carne, Acompanhamento, Guarnição, Salada): `Checkbox` "Limitar" e, quando marcado, um `Stepper` com o máximo (zero ou mais). Salvar chama `PUT /tamanhos/{id}/limites` com `{ limites: [{ categoria, maximo }] }`, **substituindo todos os limites** (lista vazia remove todos). Texto de apoio: "Categoria sem limite fica livre, respeitando só o limite total. Porção dupla conta como 2."
- Mudanças valem dali em diante; os pedidos já feitos guardam a foto do preço (não precisa avisar na tela, mas registrar no README).

### 11.5 Usuários (papel `Dono` ou `Superuser`)
**O que a API permite:** a rota `/usuarios` é do dono ou superuser, e **dentro dela a hierarquia decide em quem cada um mexe**. `GET /usuarios` lista a si mesmo e quem a pessoa gerencia: o dono vê os funcionários e a si mesmo (**não** vê outros donos nem superusers); o superuser vê todos. A API recusa (403) o que a hierarquia não permite, mas o front deve evitar oferecer a ação.

**Regras que o front espelha (a API é a autoridade)**
- **Criar:** superuser pode criar `Funcionario`, `Dono` e `Superuser`; dono só `Funcionario`. Quem tem só um papel possível não vê seletor de papel (mostra o texto fixo "Funcionário").
- **Conceder permissão:** ninguém concede o que não tem. No formulário, cada permissão só pode ser marcada se quem edita tem aquela permissão (superuser tem todas). Criar um usuário `Superuser` não pede permissões (ele sempre tem todas: esconder a lista e mostrar "Superuser tem todas as permissões").
- **Editar (`PUT`):** troca nome e **substitui** a lista de permissões. E-mail e papel não mudam. Regra fina: manter uma permissão que a pessoa já tinha é sempre permitido; **acrescentar** é que exige que quem edita a tenha. Logo, um checkbox fica habilitado se quem edita tem a permissão **ou** o usuário editado já a tinha. Permissões de um superuser não são editáveis.
- **Ativar e desativar:** `POST /usuarios/{id}/desativar` e `/ativar`, ambas idempotentes, devolvem o `UsuarioResponse`. Desativar corta o acesso na hora. **Ninguém desativa a si mesmo** (a API recusa), então a linha da própria pessoa não tem essas ações.
- **Redefinir senha:** `PUT /usuarios/{id}/senha` com `{ novaSenha }` (204). Também destrava a conta. Só para quem a pessoa gerencia (não para si mesma: para si, "Minha conta").
- **Senha:** mínimo 8 e máximo 128 caracteres, validar no cliente com as mesmas mensagens da API. As mensagens nunca repetem a senha digitada.
- E-mail: a API grava em minúsculas e recusa duplicado com **409** ("Já existe um usuário com o e-mail ...").

**Web:** título "Usuários" (24/800) e botão `primary-ink` "Novo usuário". Tabela (mesmo estilo da de pedidos): Nome (com a marca "Você" na própria linha), E-mail, Papel (`Chip`), Permissões (`Chip`s pequenos, ou "Todas" para superuser), Situação ("Ativo" em `success-bg`/`success-text`; "Inativo" em `status-neutral`), Ações. Ações por linha (botões `outline`, `h 36` visual e 44 de toque): "Editar", "Desativar" ou "Ativar", "Redefinir senha". Na linha própria, só "Minha conta".
**Celular:** um cartão por usuário (fundo branco, borda 1 `ink`, raio 16, padding 14, mesmo padrão dos pedidos) com as mesmas informações e ações empilhadas.

**Formulário "Novo usuário"** (cartão com borda 1 `brand`, raio 14; fecha com Cancelar): **Nome**, **E-mail**, **Senha provisória** (com "Mostrar"; texto de apoio "A pessoa troca a senha depois, em Minha conta."), **Papel** (se houver mais de um), **Permissões** (lista de checkboxes com o rótulo e o nome técnico em 12 `muted`, só as que quem cria possui). Botão "Criar usuário". `POST /usuarios` com `{ nome, email, senha, papel, permissoes }` (`permissoes` é lista de nomes). 201 devolve o usuário; atualizar a lista.
**Formulário "Editar":** mesmo cartão, com Nome editável, E-mail e Papel só como texto, e as permissões. Botão "Salvar". `PUT /usuarios/{id}` com `{ nome, permissoes }`.
**Desativar:** `Dialog` de confirmação: título "Desativar {nome}?", texto "A pessoa perde o acesso na hora.", botões "Cancelar" e "Desativar" (`primary-brand`). Ativar não pede confirmação.
**Redefinir senha:** `Dialog` com o campo **Nova senha** (com "Mostrar"), botão "Redefinir". Sucesso: `Banner` de sucesso "Senha redefinida. A conta também foi destravada."

### 11.6 Minha conta (`/loja/conta`, qualquer usuário logado)
- Cartão com nome, e-mail, `Chip` do papel e as permissões (somente leitura, em `Chip`s).
- Formulário **Trocar senha**: **Senha atual**, **Nova senha**, **Confirmar nova senha** (a confirmação é só do front). `POST /auth/trocar-senha` com `{ senhaAtual, novaSenha }` (204).
- Validação no cliente: nova senha de 8 a 128 caracteres; a confirmação igual à nova.
- Erro 400 "Senha atual incorreta.": mostrar a mensagem. **Aviso fixo abaixo do campo:** "Errar a senha atual 5 vezes bloqueia a conta por 15 minutos." (acertar a regra da API: cada erro conta como falha de login).
- Sucesso: limpar os campos e mostrar `Banner` de sucesso "Senha alterada." Não deslogar.
