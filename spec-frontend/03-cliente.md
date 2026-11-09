# KF Restaurante, spec do frontend (parte 3 de 9): Área do cliente

Ler primeiro o `00-indice.md`. Esta parte faz parte de uma spec dividida em arquivos; as referências a "seção N" apontam para o número da seção, e o índice diz em qual arquivo cada seção está.

## 9. Área do cliente

### 9.1 Dados e estado
- Ao abrir, em paralelo: `GET /restaurante` (aberto), `GET /cardapios/hoje` (opções, situação) e `GET /tamanhos` (com limites). Reconsultar restaurante e cardápio a cada 60 segundos e quando a janela voltar a ter foco, para o "esgotado" e o "fechado" chegarem sem recarregar a página.
- O cliente **não** consulta `GET /opcoes` (exige login). Tudo vem do cardápio de hoje.
- Carrinho e formulário: Context + reducer, em memória.
- Item de marmita: id único, tamanho, lista ordenada de ids de componentes, quantidade (começa em 1), preço unitário (preço do tamanho). Cada marmita montada é uma linha separada, mesmo que idêntica a outra.
- Item avulso: agrupado por opção, com quantidade que soma ao adicionar de novo.
- **Quais opções entram onde (regra do domínio):**
  - Componente de marmita: categoria que **não** seja Bebida nem Sobremesa. Aparece nos tiles de montar e na lista "Hoje tem".
  - Avulso ("Pra acompanhar"): qualquer opção com **preço** (`preco` diferente de nulo), de qualquer categoria. Uma opção de categoria componente com preço (ex.: uma Feijoada) aparece nos dois lugares: como avulso e como tile.
  - Opção sem preço nunca é avulsa.
- Itens esgotados continuam visíveis, mas não podem ser adicionados ou marcados.
- Se, depois de um recarregamento automático, uma linha do carrinho passar a conter um item que ficou esgotado: mostrar na linha o texto "Este item acabou. Remova para continuar." (12/600 `brand-strong`) e desabilitar "Finalizar pedido".

### 9.2 Computador (`/`, 1024px ou mais)

**Cabeçalho** (padding 20 28, borda inferior `line-soft`, gap 24): Logo, navegação em `TopNavPill` (flex 1, gap 8) e, à direita, o `StatusBadge` de aberto ou fechado (no lugar da lupa do protótipo).

**Corpo:** duas colunas, `main` (largura flexível, mínimo 640) e `aside` (largura flexível, mínimo 320), com borda direita `line-soft` entre elas.

**`main`** (padding 28 28 32, gap 28 entre seções):
1. **Categoria da marmita:** título 18/700 à esquerda e ícone de filtro à direita; abaixo, linha de `FilterPill`: Todos e as categorias de componentes que existirem no cardápio. Filtra os ingredientes mostrados na seção 2.
2. **Produto** (linha com wrap, gap 28):
   - Esquerda (flex 1, mínimo 260): painel `illustration-bg`, raio 24, padding 20, altura mínima 260, ilustração 220x154 centralizada.
   - Direita (flex 1, mínimo 280, coluna, gap 14):
     - Título "Marmita {tamanho}" (28/800) e abaixo o parágrafo "Marmita montada na hora, com os ingredientes que você escolher abaixo." (14, `muted`, `line-height 1.5`).
     - Rótulo "TAMANHO" e linha de `SizeButton` (gap 8) com as letras dos tamanhos.
     - Rótulo "MONTE SUA MARMITA · n/limite" e as `IngredientTile` (gap 10), filtradas pela categoria escolhida (ou todos os componentes quando "Todos").
     - Linha de ação (gap 14, margem superior 4): `Stepper` de quantidade + botão "Adicionar" dividido (preço à esquerda, "Adicionar" à direita), desabilitado enquanto não houver ingrediente marcado.
3. **Pra acompanhar:** título 16/700; grade `auto-fill, minmax(190px, 1fr)`, gap 14; cada cartão com `padding 12`, borda 1 `line-soft`, raio 16, gap 12: quadrado de 44 (raio 12, cor da categoria), nome 14/600 e preço 13/700 `brand` (ou "Esgotado"), botão "+" circular de 32 (`brand`, ou `#E7E9ED` se esgotado).

**Não existe modo "montar" separado no computador.** A seção de produto fica sempre visível, com o tamanho do meio selecionado ao abrir. A query `?tamanho=<id>` serve só para manter o tamanho escolhido ao recarregar ou ao vir de `/montar/:tamanhoId`.

**`aside` "Meu pedido"** (padding 28 24, gap 16, `position: sticky; top: 24px`, rolável internamente se passar da altura da tela):
- Cabeçalho: "Meu pedido" 20/800 e "{n} itens" 13 `muted` à direita (singular: "1 item").
- Vazio: texto "Seu pedido vai aparecer aqui." 14 `muted`.
- Itens: linhas `surface`, raio 16, padding 10, gap 12: quadrado 44 (`#F3D8CF`), nome 14/600, detalhe 12 `muted` em uma linha com reticências, preço "R$ x,xx cada" 13/700 `brand`; stepper pequeno à direita.
- **Formulário de finalização (inexistente no protótipo do computador):** abaixo da lista de itens, replicar exatamente os campos do celular (seção 9.3, tela 3), com os mesmos componentes e a mesma ordem: Nome, WhatsApp, Como você recebe (+ Endereço e Referência), Pagamento (+ Troco), Observação.
- Totais: borda superior tracejada 1 `dash`, padding-top 10. Linha "Total" 20/800. **Não existe linha de entrega**: o backend não cobra taxa de entrega.
- Botão "Confirmar pedido" (`h 52`, raio 14, `brand`, 16/700; desabilitado quando faltar dado). Abaixo, 12 `muted` centralizado: "O pedido chega no WhatsApp da loja."

### 9.3 Celular (menor que 1024px), 4 telas

**Tela 1: Cardápio (`/`)**
- Cabeçalho (padding 18 20 14, borda inferior `line-soft`, gap 10): linha com Logo (celular) e `StatusBadge`; abaixo, linha de `FilterPill` (celular) rolável na horizontal: Todos e as categorias de componentes que existirem no cardápio.
- Corpo rolável (padding 18 20 20, gap 22):
  1. "Monte sua marmita" (16/700) e a grade de `SizeCard`.
  2. "Hoje tem" (16/700): lista dos componentes. Linha: `padding 10 0`, borda inferior `line-row`; à esquerda círculo de 28 (cor da categoria) e nome 15; à direita a categoria em 12 `muted`. Esgotado: nome riscado em `blocked` e, no lugar da categoria, o texto "acabou". **O filtro de categoria do cabeçalho filtra só esta lista.** Ordenar por ordem das categorias (seção 12.1) e depois por nome.
  3. "Pra acompanhar" (16/700): linhas de `padding 10`, fundo `surface`, raio 16, gap 12: quadrado 40 (raio 10), nome 14/600 (riscado e `blocked` se esgotado), preço 13/700 `brand` (ou "Esgotado"), e à direita a quantidade no carrinho ("2x", 14/700 `brand`) quando houver, e o botão "+" circular de 32.
- Rodapé fixo (padding 12 20 18, borda superior `line-soft`):
  - Carrinho vazio: botão `primary-brand` "Montar minha marmita" (52, raio total), que vai a `/montar/{tamanho padrão}`.
  - Com itens: botão `primary-ink` "Ver pedido · N itens" à esquerda e o total à direita, que vai a `/pedido`. (Neste estado o botão "Montar minha marmita" some; para outra marmita, usar os `SizeCard`.)
- Tamanho padrão ao abrir "Montar" sem escolher: o tamanho do meio da lista (o segundo, se houver 3), ou o primeiro se houver menos.
- Loja fechada ou cardápio encerrado: seção 14.

**Tela 2: Montar marmita (`/montar/:tamanhoId`)**
- Cabeçalho (padding 16 20 14, borda inferior `line-soft`, gap 10): botão voltar "Cardápio" (`ghost-back`, volta ao `/`); título "Marmita {tamanho}" (24/800); linha com os `SizeButton` (celular) e, à direita, o contador "n/limite" em 13/700 `muted`.
- Corpo rolável (padding 16 20 18, gap 18): um grupo por categoria de componente que exista no cardápio, na ordem da seção 12.1. Cada grupo: título 15/700 e, se o tamanho tiver limite para a categoria, o texto "até N" (12/600 `brand-strong`; se o máximo for 0, "não incluso neste tamanho" e todos os tiles do grupo ficam bloqueados); depois as `IngredientTile`.
- Rodapé (padding 12 20 18, borda superior `line-soft`, gap 8): quando nada estiver marcado, o texto "Escolha pelo menos um item" (13, `muted`, centralizado); botão "Adicionar ao pedido" com o preço à direita (52, raio total; escuro quando habilitado, desabilitado quando vazio).
- Ao adicionar: cria a linha de marmita no carrinho (quantidade 1), limpa a seleção e volta ao `/`.
- Trocar de tamanho no cabeçalho mantém a seleção atual, aplicando a regra da seção 12.2.

**Tela 3: Meu pedido (`/pedido`)**
- Cabeçalho (padding 16 20 14, borda inferior `line-soft`, gap 8): botão voltar "Continuar escolhendo"; título "Meu pedido" (24/800).
- Corpo rolável (padding 16 20 18, gap 16):
  - Itens (gap 10): linha `surface`, raio 16, padding 10, gap 12: quadrado 40 (`#F3D8CF`, raio 10), nome "Nx Marmita M" 14/600 e detalhe 12 `muted` (ingredientes, uma linha com reticências), subtotal 14/700 `brand`, stepper (26).
  - Bloco "Nome" e "WhatsApp" (gap 8): labels 13/600 `muted`, campos da seção 8.
  - "Como você recebe": label 13/600 `muted`; grade de 2 `ChoiceButton` (Retirada, Entrega); com "Entrega", campo de **Endereço** (obrigatório, placeholder "Endereço: rua, número, bairro") e campo de **Ponto de referência** (opcional).
  - "Pagamento": label; grade de 2 colunas com `ChoiceButton` Pix, Dinheiro, Débito, Crédito; com "Dinheiro", campo de **troco** (opcional) com placeholder "Troco para quanto?".
  - **Observação** (opcional): campo de duas linhas, placeholder "Ex.: sem cebola".
- Rodapé (padding 12 20 18, borda superior, gap 8): linha "Total" (14 `muted`) com o valor 26/800; mensagem de pendência (13 `muted`, centralizada) quando houver; botão "Finalizar pedido" (52, raio total; escuro habilitado, desabilitado enquanto houver pendência).
- Ao finalizar com sucesso: vai a `/confirmacao/:numero`.

**Tela 4: Confirmação (`/confirmacao/:numero`)**
- Corpo (padding 32 20 20, gap 18): círculo de 56 `success-bg` com check verde (`success`, traço 3); título "Pedido nº {numero} registrado" (26/800); parágrafo "Agora é só enviar pro WhatsApp da loja. Ela confirma por lá." (14 `muted`, `line-height 1.5`); caixa `surface`, raio 16, padding 16, 14, `line-height 1.5`, `white-space: pre-line`, com o texto de `mensagemWhatsApp` **exatamente como a API devolveu** (seção 12.4).
- Rodapé (padding 12 20 18, gap 8): botão `whatsapp` "Enviar no WhatsApp" (52) e botão de texto "Fazer outro pedido" (46, texto `brand` 14/700), que limpa o carrinho e a confirmação e volta a `/`.
- No computador, a mesma tela ocupa a página, centralizada (max 680).
- Esta tela **não consegue recarregar o pedido pela API**: `GET /pedidos/{id}` exige login. Os dados vêm da resposta do `POST /pedidos` (seção 12.5).
