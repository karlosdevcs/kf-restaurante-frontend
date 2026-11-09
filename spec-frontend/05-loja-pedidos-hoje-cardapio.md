# KF Restaurante, spec do frontend (parte 5 de 9): Área da loja (1 de 2): Pedidos, Hoje e Cardápio

Ler primeiro o `00-indice.md`. Esta parte faz parte de uma spec dividida em arquivos; as referências a "seção N" apontam para o número da seção, e o índice diz em qual arquivo cada seção está.

## 11. Área da loja

Cabeçalho comum: Logo + "Painel da loja", o `StatusButton` e o `UserMenu`. Abaixo, as abas. Conteúdo com padding 24 (web) / 16 18 18 (celular), título da aba e o conteúdo. Toda mutação mostra `Banner` de erro no topo da área de conteúdo quando falhar, com a mensagem do `ProblemDetails`.

### 11.1 Pedidos (`VerPedidos`)
**Dados**
- Lista: `GET /pedidos` (dia de hoje, do mais recente ao mais antigo). Resposta é uma **lista de resumos** (`PedidoResumoResponse`): `id`, `numero`, `horaPedido` (UTC), `nomeCliente`, `telefone` (só dígitos com DDD), `status`, `formaDePagamento`, `tipoDeEntrega`, `total`. **O resumo não traz itens, endereço, referência, observação nem troco.**
- Detalhe: `GET /pedidos/{id}` (`PedidoResponse`) traz `itens` (nome, componentes, preço unitário, quantidade, subtotal), `endereco`, `referencia`, `observacao`, `trocoPara`, `mensagemWhatsApp` e `linkWhatsApp`.
- A coluna "Itens" do protótipo exige o detalhe. Buscar o detalhe de cada pedido visível, sob demanda (esqueleto de uma linha enquanto carrega), com cache sem expiração por id (itens congelados não mudam; só o status muda, e ele vem da lista). Assim, o polling da lista não refaz os detalhes.
- Polling da lista a cada 30 segundos enquanto a aba estiver visível, e ao voltar o foco para a janela. Os pedidos novos entram no topo e são anunciados para leitor de tela (`aria-live="polite"`: "Novo pedido nº X"). Sem som e sem notificação.
- A contagem dos filtros vem sempre da lista completa do dia (sem enviar `status` à API); o filtro ativo é aplicado no cliente.
- Parâmetro `data` existe na API; esta versão só usa "hoje".

**Mapeamento de status (a API devolve `Gerado` ou `Enviado`):** `Gerado` → "Não enviado"; `Enviado` → "Enviado". Significado: "Enviado" quer dizer que o cliente tocou em "Enviar no WhatsApp", **não** que a mensagem saiu. A tela não deve prometer mais do que isso.

**Filtros (contadores clicáveis):** Todos, Enviados, Não enviados (no celular, o terceiro rótulo é "Não env.").

**Web** (título "Pedidos de hoje" 24/800 e subtítulo "O mais recente aparece primeiro" 13 `muted`):
- Cartões de filtro: `min-w 110`, `padding 10 14`, raio 12, borda 1 (`brand` quando ativo, `line-soft` senão), fundo branco; contagem 22/800 (`brand-strong` ativo, `ink` senão) e rótulo 12 `muted`.
- Layout: tabela (flex 999, mínimo 600) e, **só com `EsgotarOpcoes`**, a coluna "Acabou alguma coisa?" (flex 1, mínimo 280), gap 24. Sem essa permissão, a tabela ocupa a largura toda.
- Tabela: cartão branco, borda 1 `line-soft`, raio 16, `overflow-x: auto`, `min-width 680`. Cabeçalho 12, caixa alta, letter-spacing 0.5, `muted` (`padding 12 16`, borda inferior `line-soft`). Colunas: Pedido, Cliente, Itens, Total (alinhado à direita), Status. Células `padding 14 16`, borda inferior `line-row`, alinhamento ao topo.
  - Pedido: "Nº {numero}" 700 e a hora (12 `muted`, HH:mm no fuso de São Paulo).
  - Cliente: nome 600 e telefone formatado 12 `muted`.
  - Itens: "1x Marmita G (Arroz, Feijão), 2x Coca-Cola" (cada item: `{quantidade}x {nome}` e, se houver, ` ({componentes})`; avulso sem parênteses). Abaixo, 12 `muted`: `Entrega, {endereco}` ou `Retirada`, mais ` · {forma de pagamento}` e, para dinheiro, `, troco para R$ X` ou `, sem troco`. Quando houver, mais duas linhas de 12 `muted`: `Ref.: {referencia}` e `Obs.: {observacao}`.
  - Total: 700 `brand`, `white-space: nowrap`.
  - Status: `OrderStatusPill`; se "Não enviado", abaixo (mt 8) o botão `outline-brand` "Chamar no WhatsApp" (`h 34`, `px 12`, 12/700) e a linha inteira com fundo `warn-row`.
- Coluna "Acabou alguma coisa?" (cartão branco, borda `line-soft`, raio 16, padding 18): título 16/700, legenda "Um toque e o cliente vê na hora." (13 `muted`, mb 6) e a lista das opções do cardápio de hoje com `AvailabilityToggle` (h 34). Detalhes na seção 11.2.

**Celular:** título 22/800; grade de 3 cartões de filtro (`padding 10 10 8`, raio 12, fundo `surface`, borda 1 `brand` ativo / `line-soft`; contagem 22/800, rótulo 11 `muted`); abaixo, um cartão por pedido: fundo branco, **borda 1 `ink`**, raio 16, padding 14, gap 8. Dentro: linha com "Nº {numero}" 16/700 + hora 12 `muted` e `OrderStatusPill` à direita; linha com nome 14/600 e telefone 12 `muted`; itens 13 (`line-height 1.4`); rodapé com borda superior 1 `line` (a linha de entrega e pagamento em 12 `muted` e o total 16/800 `brand`); e, se "Não enviado", botão `outline-brand` "Chamar no WhatsApp" (`h 40`, 13/700). No celular, `EsgotarOpcoes` é atendido na aba Hoje.

**"Chamar no WhatsApp"** (pedido não enviado): abre `https://wa.me/55{telefone}?text={mensagem}` em nova aba (`target="_blank"`, `rel="noopener noreferrer"`). O telefone do pedido é só DDD e número, então acrescentar o `55` do Brasil na frente. Mensagem padrão (codificada com `encodeURIComponent`): `Olá, {nome}! Aqui é do KF Restaurante, sobre o seu pedido nº {numero}.`

### 11.2 Hoje (`AbrirFecharLoja`, `EsgotarOpcoes` ou `AlterarWhatsApp`)
Cada bloco abaixo só aparece com a permissão correspondente.

- **Cartão de status (`AbrirFecharLoja`):** web: padding 20, borda `line-soft`, raio 16; celular: padding 16, fundo `surface`, raio 16. Bolinha de 10, título "Loja aberta"/"Loja fechada" (22/800 web, 18/800 celular), descrição 14/13 `muted` ("Clientes conseguem pedir agora." / "Clientes veem o cardápio, mas não conseguem pedir.") e botão `primary-ink` "Fechar a loja" / "Abrir a loja" (`h 46` web raio 12; `h 44` celular raio total).
  - Estado vem de `GET /restaurante` (`aberto`), reconsultado a cada 60 segundos. Ação: `POST /restaurante/abrir` ou `/fechar`, que devolvem o `RestauranteResponse` novo. As duas são idempotentes.
  - **Abrir sem WhatsApp cadastrado volta 400** ("Cadastre o WhatsApp da loja antes de abrir."). Mostrar a mensagem e, se a pessoa tiver `AlterarWhatsApp`, foco no campo do WhatsApp logo abaixo.
- **Cartão "WhatsApp da loja" (`AlterarWhatsApp`):** mostra o número atual formatado (`+55 (31) 99999-9999`; sem número, "Não cadastrado" e o aviso "A loja só abre com o WhatsApp cadastrado."), e um campo para alterar (placeholder "+55 (31) 99999-9999"), botão `primary-ink` "Salvar". `PUT /restaurante/whatsapp` com `{ whatsApp }` (a API aceita com ou sem máscara, com 12 ou 13 dígitos contando o 55; o erro 400 explica o formato). Sem `AlterarWhatsApp`, o cartão não aparece (mesmo que a pessoa tenha as outras permissões da aba).
- **"Acabou alguma coisa?" (`EsgotarOpcoes`):** título (24/800 web; 15/700 celular) e a lista das opções do cardápio de hoje. Cada linha: nome (14/600, riscado `blocked` se esgotado), categoria 12 `muted` e `AvailabilityToggle`.
  - Dados: as opções vêm de `GET /cardapios/hoje` (inclui `esgotado` de cada uma). Mudar: `PATCH /opcoes/{id}/esgotado` com `{ esgotado: boolean }`. Atualização otimista, revertida com `Banner` de erro se a API recusar. Depois do sucesso, reconsultar o cardápio.
  - Se `GET /cardapios/hoje` voltar 404 (não há cardápio publicado ou fechado hoje), mostrar "Sem cardápio publicado hoje." (e, com `GerenciarCardapio`, um link "Ir para o cardápio").
  - Web: grade `auto-fill, minmax(230px, 1fr)`, gap 10, cartões brancos com borda `line-soft`, raio 14, padding `10 12`; toggle `h 36`. Celular: lista com divisórias `line-row`, padding `9 0`; toggle `h 36`.
- Layout web: cartão de status e WhatsApp à esquerda (flex 1, mínimo 300), a grade à direita (flex 2, mínimo 480), gap 24.

### 11.3 Cardápio (`GerenciarCardapio`)
**O que a API permite (e o que não):** existe **um cardápio por dia**, sempre do "hoje" de Brasília. `POST /cardapios` cria o cardápio de hoje já com a lista de opções (sempre como **rascunho**). Não existe endpoint para trocar as opções de um cardápio já criado. `POST /cardapios/{id}/publicar` abre as vendas (e também **reabre** um cardápio fechado), `POST /cardapios/{id}/fechar` encerra (fechar um rascunho dá 400). Tudo é idempotente. `GET /cardapios/{id}` devolve o cardápio completo para quem tem a permissão. **`GET /cardapios/hoje` (aberta) só devolve publicado ou fechado; para rascunho responde 404.**

**Estados da aba**
1. **Sem cardápio de hoje** (nenhum id conhecido): mostrar a grade de seleção de todas as opções (`GET /opcoes`) com checkboxes locais, o contador "{n} opções no cardápio" e o botão `primary-ink` **"Criar cardápio"** (desabilitado com 0 marcadas), que chama `POST /cardapios` com `{ opcoesIds }`. Sucesso (201): guardar o id do cardápio (ver abaixo) e passar para o estado Rascunho.
2. **Rascunho:** pílula "Rascunho", lista das opções escolhidas (somente leitura) e botão **"Publicar cardápio"**. Texto: "Escolha feita. O cliente só vê depois que você publicar." e, em `muted`, "Hoje não dá para trocar as opções de um cardápio criado."
3. **Publicado:** pílula "Publicado", botão **"Fechar cardápio"**. Texto: "O cliente já está vendo. Pra tirar um item hoje, marque como esgotado na aba Hoje."
4. **Fechado:** pílula "Fechado", botão **"Reabrir cardápio"** (chama `/publicar`). Texto: "Encerrado por hoje."

**Como o painel descobre o cardápio de hoje:** primeiro `GET /cardapios/hoje` (cobre Publicado e Fechado). Se for 404, tentar o id guardado no `localStorage` (chave `kf:cardapio-hoje`, com `{ data, id }` do dia de Brasília; é só um id, sem dado pessoal) com `GET /cardapios/{id}`. Se não houver id guardado, mostrar o estado 1. Se `POST /cardapios` responder **409** ("Já existe um cardápio para a data ..."), significa que alguém já criou o rascunho de hoje em outro lugar e o painel não consegue achá-lo: mostrar o `Banner` de erro com a mensagem da API e um segundo texto "Esse cardápio está em rascunho e não pode ser aberto por este painel." É uma **lacuna do backend** (seção 16, item 4): reportar, não contornar.

**Layout (igual ao protótipo):**
- Cartão de situação (web: padding `18 20`, borda `line-soft`, raio 16; celular: fundo `surface`, raio 16, padding `14 16`): título "Cardápio do dia" (24/800 web) e a pílula da situação (fundo `brand-tint`, texto `brand-strong`, 13/700, `padding 4 12`, raio total), com o texto de apoio do estado.
- Botão de ação (`primary-ink`; web `h 46`, `px 20`, raio 12; celular fixo no rodapé, `h 52`, raio total).
- Contagem: "{n} opções no cardápio" (web 14/700 `muted`) / "{n} opções" (celular 13/700 `muted`).
- Lista de opções, cada uma com checkbox (seção 8), nome 14/600 e linha 12 `muted` com "Categoria" e, se houver, "· R$ preço". Web: grade `auto-fill, minmax(220px, 1fr)`, gap 10, cartões brancos com borda 1 (`brand` marcado / `line-soft`), raio 14, `min-h 52`. Celular: lista com divisórias `line-row`, `min-h 46`.
- Os checkboxes só são editáveis no estado 1; nos demais, ficam desabilitados e mostram só o que está no cardápio.
