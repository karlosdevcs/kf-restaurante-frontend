# KF Restaurante, spec do frontend (parte 2 de 9): Componentes base

Ler primeiro o `00-indice.md`. Esta parte faz parte de uma spec dividida em arquivos; as referências a "seção N" apontam para o número da seção, e o índice diz em qual arquivo cada seção está.

## 8. Componentes base

Medidas em px. "Desktop" e "celular" só aparecem quando diferem.

**Logo.** Círculo `brand` (34 desktop, 28 celular) com o ícone branco dentro (17 e 14); ao lado, `KF` em `ink` e `Restaurante` em `brand`, colados, mesmo peso, em uma linha. Gap entre círculo e texto 10 (desktop) / 8 (celular). Na loja, o desktop acrescenta à direita "Painel da loja" (13, `muted`) separado por borda esquerda `line-soft` com padding-left 8.

**Button**
- `primary-ink`: fundo `ink`, texto branco.
- `primary-brand`: fundo `brand`, texto branco.
- `outline-brand`: fundo branco, borda 1 `brand`, texto `brand`.
- `outline`: fundo branco, borda 1 `line`, texto `ink`.
- `ghost-back` (só no celular): sem fundo, texto `muted` 14/600, com seta, área de toque de 44.
- `whatsapp`: fundo `success-text`, texto branco, ícone do WhatsApp 20.
- Alturas: 52 (CTA de rodapé, "Confirmar pedido", "Entrar"), 48 (adicionar no desktop), 46 (formulários e ações de cartão), 44 (escolhas e ações pequenas no celular), 40 (pílulas e filtros), 36 e 34 (toggles de disponibilidade, ver abaixo). Raio `9999px` exceto: "Confirmar pedido" no desktop (14), botões de escolha (12), botões de tamanho (10).
- Área de toque mínima de 44px (ver seção 15 para os botões visualmente menores).
- Com a ação em andamento: rótulo vira "Enviando...", "Entrando...", "Salvando..." e o botão fica desabilitado.

**FilterPill** (categoria): `h 40 px 18 14/600` no desktop, `h 36 px 14 13/600` no celular, `white-space: nowrap`, linha com `overflow-x: auto` e gap 10 (desktop) / 8 (celular). Ativa: borda `brand`, fundo `brand-tint`, texto `brand-strong`. Inativa: borda `line`, fundo branco, texto `ink`. `aria-pressed`.

**TopNavPill** (desktop do cliente): `h 40 px 16 14/600`, ativa fundo `ink` texto branco borda `ink`; inativa branca com borda `line`.

**SizeCard** (celular, tela Cardápio): grade de 3 colunas, gap 10. Cada cartão: `padding 14 6`, raio 16, fundo `surface`, sem borda, coluna centralizada com gap 6. Letra do tamanho 22/800; linha "N itens" 11 `muted`; preço 14/700 `brand`. O botão leva a `/montar/:id`.

**SizeButton** (seletor de tamanho): botão de 40 de altura (desktop) ou 36 (celular), `px 18` / `px 14`, raio 10, 14/700. Ativo: fundo `ink`, texto branco, borda `ink`. Inativo: branco, borda `line`. `aria-pressed`.

**IngredientTile**: largura 76, `padding 10 4`, raio 14, borda 1; coluna centralizada, gap 6. Dentro: círculo de 32 (cor da categoria) e rótulo 11.5/600, centralizado, `line-height 1.2`. Grade: `flex-wrap`, gap 10.
- Padrão: borda `line`, fundo branco.
- Marcado: borda `ink`, fundo `tile-selected-bg`, círculo `ink` com check branco de 16 (traço 3).
- Bloqueado: rótulo `blocked`, `disabled`.
- Esgotado: rótulo "Nome (acabou)" e bloqueado.

**Stepper de quantidade (desktop, produto)**: contêiner com borda 1 `line`, raio total, `padding 4 6`, gap 10. Botões circulares de 30, fundo `canvas`. Contagem 15/700, largura mínima 16, centralizada. Mínimo 1.

**Stepper de linha do carrinho**: botões circulares 24 (desktop) / 26 (celular), borda 1 `line`, fundo branco, contagem 13/700 largura mínima 14. Chegar a 0 remove o item.

**Field (campo de texto)**: celular do cliente e login: `h 46 px 14`, borda 1 `line`, raio 12, fundo `surface`, texto 15. Formulários da loja web: `h 44 px 12`, raio 10, fundo `surface`, texto 14. Formulários da loja no celular: mesma coisa, fundo branco dentro de um cartão `surface`. Todo campo tem `label` ligado por `htmlFor`, mesmo quando visualmente oculto (seção 15). Atributos: telefone `type="tel"` e `inputMode="tel"`; troco e preço `inputMode="decimal"`; e-mail `type="email"` com `autoComplete="username"`; senha `type="password"` com `autoComplete="current-password"` (login e senha atual) ou `"new-password"` (senha nova). Campo de senha tem botão "Mostrar" / "Ocultar" à direita (texto 13/600 `muted`, `aria-pressed`, área de toque 44).

**ChoiceButton** (Retirada/Entrega, pagamento, categoria e papel nos cadastros): grade, gap 8 (6 no cadastro). Alturas 44 (cliente), 38 a 44 (loja). Raio 12 (cliente) / 10 (loja). Ativo: fundo `ink` texto branco borda `ink`; inativo branco borda `line` texto `ink`. Texto 14/700 (pagamento 13/700 com `px 4`; categoria no cadastro 13 ou 14/600). `aria-pressed`.

**Checkbox de lista** (cardápio, permissões): caixa de 20, raio 6, borda 2 `ink`; marcada: fundo `brand` com check branco de 12; desabilitada: borda `#D7DADF`. Sempre dentro de um `button` ou `label` com o texto, com `role="checkbox"` e `aria-checked` se for `button`.

**Banner** (mensagens): raio 12, `padding 12 14`, 14/600. `erro`: fundo `brand-tint`, texto `brand-strong`, `role="alert"`. `sucesso`: fundo `success-bg`, texto `success-text`, `role="status"`. `aviso`: fundo `warn-bg`, texto `warn-text`, `role="status"`. `info`: fundo `surface`, texto `muted`, `role="status"`.

**Dialog** (confirmações e redefinir senha): sobreposição `overlay`; cartão branco, raio 20, `padding 24`, `max-width: 400px`, gap 14. Título 18/800, texto 14 `muted`, botões à direita (`outline` + ação). Prende o foco dentro, fecha com Esc, devolve o foco ao botão que abriu. No celular, ancora no rodapé da tela (folha) com raio 20 só em cima.

**Chip** (permissão, papel): `padding 4 10`, raio total, 12/600, fundo `surface`, borda 1 `line-soft`, texto `ink`. O chip de papel usa fundo `ink` e texto branco (superuser) ou `status-neutral` (demais).

**StatusBadge do cliente:** "Aberto" com bolinha: `12/700`, `padding 6 12`, raio total, fundo `success-bg`, texto `success-text`. Fechada: fundo `brand-tint`, texto `brand-strong`, texto "Fechado". A bolinha é um `span` de 8 a 9px (não o caractere "●").

**StatusButton da loja** (abrir e fechar): botão de `h 40 (web) / 34 (celular)`, `px 16 / 12`, borda 1 `line`, fundo `surface`, raio total, 14/700 (web) ou 12/700 (celular); à esquerda bolinha de 8 (web) / 7 (celular), `success` quando aberta e `brand` quando fechada. Texto web "Loja aberta" / "Loja fechada"; celular "Aberta" / "Fechada". Clicar alterna. `aria-label`: "Loja aberta. Clicar para fechar" / "Loja fechada. Clicar para abrir". **Eu pedi explicitamente para manter este botão com a bolinha verde.** Sem a permissão `AbrirFecharLoja`, vira o mesmo visual **sem ser botão** (um `span` informativo, sem hover e sem cursor de clique).

**UserMenu** (cabeçalho da loja, à direita do `StatusButton`): círculo de 34 (celular 34, área de toque 44), fundo `canvas`, iniciais do nome em 13/700 `ink`. No desktop, o nome (14/600) aparece ao lado. Abre um cartão (branco, borda `line-soft`, raio 16, `padding 8`, `min-width 220`) com: nome (14/700), e-mail (12 `muted`), `Chip` do papel, divisória, "Minha conta" e "Sair" (itens de 44 de altura, 14/600). Fecha com Esc e clique fora. No celular o mesmo conteúdo abre como folha de rodapé.

**Tabs da loja (web):** barra branca com borda inferior `line-soft`; abas com `min-h 44`, `px 16`, 14/600, sem fundo, borda inferior de 2px (`brand` na ativa, transparente nas outras), texto `brand` na ativa e `muted` nas outras. Semântica completa (`role="tablist"`, `tab`, `tabpanel`). Só aparecem as abas permitidas (seção 10.5).

**BottomTabBar (celular loja):** grade com **uma coluna por aba permitida** (de 1 a 5), fundo branco, borda superior `line-soft`; cada aba `min-h 56`, 12/700, borda superior de 2px (`brand` na ativa), texto `brand` ativa e `muted` inativa.

**AvailabilityToggle:** pílula `min-w 86` (web) / 90 (celular), `h 34` (aside web) / 36 (demais), `px 10`, 13/700. "Disponível": fundo branco, borda 1 `success-line`, texto `success-text`. "Esgotado": fundo e borda `ink`, texto branco. `aria-pressed` igual a "esgotado". Rótulo de acessibilidade: "Nome: disponível" / "Nome: esgotado".

**OrderStatusPill (loja):** `12/700`, `padding 4 10`, raio total. "Enviado": `status-neutral`. "Não enviado": `warn-bg` / `warn-text`.
