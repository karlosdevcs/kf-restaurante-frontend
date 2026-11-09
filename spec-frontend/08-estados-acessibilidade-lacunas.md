# KF Restaurante, spec do frontend (parte 8 de 9): Estados de carregamento, vazio e erro, acessibilidade e lacunas

Ler primeiro o `00-indice.md`. Esta parte faz parte de uma spec dividida em arquivos; as referências a "seção N" apontam para o número da seção, e o índice diz em qual arquivo cada seção está.

## 14. Estados de carregamento, vazio e erro

O protótipo só mostra o estado feliz. Definir assim, no mesmo estilo visual:

**Carregamento:** blocos `canvas` (`#F1F2F5`) no formato do conteúdo (esqueleto), raio igual ao do elemento. Sem spinner global. Botões de ação mostram o rótulo "Enviando...", "Entrando...", "Salvando..." e ficam desabilitados.

**Vazio**
- Cliente sem cardápio hoje (404 de `GET /cardapios/hoje`): cartão centralizado, título "A loja ainda não publicou o cardápio de hoje" (18/700) e texto "Volte em alguns minutos." (14 `muted`). Sem carrinho e sem botão de montar.
- Cardápio sem componentes: mesma mensagem do estado sem cardápio.
- Carrinho vazio: textos da seção 17.
- Loja sem pedidos no dia: "Nenhum pedido ainda hoje." Com filtro ativo sem resultado: "Nenhum pedido nesse filtro."
- Aba Hoje sem cardápio publicado: "Sem cardápio publicado hoje."

**Loja fechada ou cardápio encerrado (cliente)**
- Quando `GET /restaurante` devolve `aberto: false`: `StatusBadge` "Fechado" no cabeçalho e uma faixa abaixo do cabeçalho (fundo `brand-tint`, texto `brand-strong`, 14/600, `padding 10 20`): "A loja está fechada. Você pode ver o cardápio, mas não consegue pedir agora."
- Quando o cardápio vem com `situacao: "Fechado"`: mesma faixa, com "O cardápio de hoje foi encerrado. Você pode ver o que teve, mas não consegue pedir."
- Nos dois casos, todos os botões de adicionar, o de montar e o de finalizar ficam desabilitados.
- A API também recusa o pedido nesses casos (400); o bloqueio no front é por clareza, não por segurança.

**Erro**
- Falha de rede ou 5xx ao carregar: cartão com "Não foi possível carregar" e botão `outline` "Tentar de novo".
- 400 ao finalizar: seção 12.5.
- 409 ao salvar opção, tamanho ou usuário: a mensagem da API abaixo do campo relevante (Nome, E-mail).
- Falha ao marcar esgotado, abrir ou fechar a loja, publicar ou fechar cardápio: reverter a mudança otimista e mostrar `Banner` de erro no topo da área de conteúdo.
- 401 e 403: seção 10.3.

## 15. Acessibilidade e ajustes em relação ao protótipo

O protótipo é a referência visual, mas alguns pontos não atendem acessibilidade. Em produção, aplicar estes ajustes (mudam pouco o visual):

1. **Contraste do texto vermelho em fundo vermelho-claro.** `#D6381F` sobre `#FCEAE6` dá cerca de 4,0:1 (abaixo de 4,5). Usar `brand-strong` (`#B3241B`) nesses textos: pílula ativa de filtro, pílula de situação do cardápio, regra "até N", faixa de loja fechada, caixas de erro. Preços `#D6381F` sobre branco passam (4,7:1) e continuam como estão.
2. **Contraste do cinza claro.** `#8A8F98` sobre branco dá cerca de 3,3:1. Em qualquer texto informativo pequeno (legendas, rótulos em caixa alta, hora, contagens, "Painel da loja", frase abaixo do botão), usar `muted` (`#6B707A`, cerca de 5:1). Deixar `subtle` só para placeholder e decoração.
3. **Verde.** `#1E8A4C` sobre branco dá cerca de 4,4:1. Para texto verde e para o fundo do botão do WhatsApp (texto branco), usar `success-text` (`#187A42`, cerca de 5,4:1). A bolinha e o ícone de sucesso continuam `success`.
4. **Área de toque.** No protótipo há controles com menos de 44px: botões de passo do carrinho (24 e 26), "+" dos acompanhamentos (32), steppers de quantidade (30), toggles da loja (34 e 36), botões da tabela (34), botão de status da loja no celular (34). Manter o tamanho visual, mas garantir 44x44 de área clicável (padding invisível, `min-width`/`min-height` ou pseudo-elemento).
5. **Campos sem rótulo visível.** No protótipo, Endereço (celular), Troco, Nome da opção e Preço usam só placeholder. Todo campo precisa de `label` (pode ser visualmente oculto com classe `sr-only`).
6. **Semântica.** `button` para toda ação, `a` só para navegação (o botão "Enviar no WhatsApp" é um `a`). Toggles e opções com `aria-pressed`. Abas da loja com `role="tablist"`, `tab` e `tabpanel`. Barra de abas do rodapé com `nav` e `aria-label="Seções da loja"`. Regiões `aria-live="polite"` para: mudança no contador de itens marcados, erros de formulário, pedidos novos e mudança de aba por falta de permissão.
7. **Foco.** Anel visível em tudo; ao trocar de tela no celular, mover o foco para o título da tela nova. Ao abrir o formulário de nova opção ou de novo usuário, foco no primeiro campo. Diálogos prendem o foco e o devolvem ao fechar.
8. **Cor não pode ser a única pista.** Esgotado já tem texto ("acabou"/"Esgotado") e risco; "Não enviado" tem texto além da cor; "Ativo"/"Inativo" têm texto. Manter.
9. **Idioma e título.** `<html lang="pt-BR">`; `<title>` por rota ("KF Restaurante", "Entrar · KF Restaurante", "Painel da loja · KF Restaurante").
10. **Movimento reduzido:** respeitar `prefers-reduced-motion`.
11. **Senha:** `autoComplete` correto para o gerenciador de senhas funcionar; botão "Mostrar"/"Ocultar" com `aria-pressed`; nunca desativar colar no campo.

**Segurança no front**
- React já escapa texto; **proibido** `dangerouslySetInnerHTML`. A mensagem do WhatsApp e qualquer texto vindo da API (nome de cliente, observação, nome de opção) é renderizado como texto.
- Links externos com `rel="noopener noreferrer"`.
- Nenhum segredo no bundle (`VITE_*` é público). Nada de chave de JWT, senha ou token em código ou em `.env` commitado.
- Não registrar token, senha nem telefone de cliente em console, em erro enviado a serviço externo ou na URL.
- Antes de expor a API na internet, o backend precisa de HTTPS e rate limiting no login (limitação já listada no README do backend). No front, apontar `VITE_API_URL` para `https://`.

## 16. Lacunas do protótipo e do backend (o que fazer com cada uma)

1. **O protótipo desktop do cliente não tem formulário de finalização.** O botão "Confirmar pedido" lateral não faz nada nele. **Decisão:** no desktop, o formulário fica **dentro da coluna lateral "Meu pedido"**, abaixo da lista de itens, com os mesmos campos, ordem, validações e componentes do celular (seção 9.2). Se preferir outro padrão (modal ou página própria), perguntar antes.
2. **Navegação do topo do desktop** ("Marmitas", "Vegetariano", "Bebidas", "Sobremesas") é decorativa no protótipo. **Decisão padrão:** manter só Marmitas, Bebidas e Sobremesas (o backend não tem "Vegetariano"); funcionam como âncoras que rolam até o produto ou até "Pra acompanhar", este filtrado pela categoria escolhida. Se eu preferir remover a navegação, eu aviso.
3. **Lupa de busca** no cabeçalho do desktop não faz nada e não há endpoint de busca. Não implementar; no lugar fica o `StatusBadge`.
4. **Cardápio em rascunho não é consultável pelo painel (lacuna do backend).** `GET /cardapios/hoje` responde 404 para rascunho, e não existe listagem de cardápios nem endpoint para trocar as opções de um cardápio criado. Mitigação nesta versão: guardar o id do cardápio criado (seção 11.3). Se o rascunho foi criado em outro dispositivo, o painel não o encontra e `POST /cardapios` dá 409. **Reportar para mim como pedido de backend:** `GET /cardapios/hoje` (ou uma rota própria) devolver o rascunho para quem tem `GerenciarCardapio`, e eventualmente um `PUT` para trocar as opções de um rascunho.
5. **"Montar novo cardápio" do protótipo não existe no backend.** O backend tem um cardápio por dia e reabre o fechado com `/publicar`. A spec troca o botão para "Reabrir cardápio" (seção 11.3).
6. **Porção dupla.** O backend aceita o mesmo componente repetido (conta como 2), e a mensagem do WhatsApp mostra "Arroz, Arroz". O protótipo só tem toggle. **Esta versão não implementa**, e fica como decisão minha: se eu quiser, a ideia é um pequeno stepper no tile marcado (1 ou 2).
7. **Edição de opções, tamanhos e limites, gestão de usuários, login e Minha conta** não existem no protótipo. Estão especificados nas seções 10 e 11 reaproveitando os componentes do Conceito 2. Se eu quiser ver telas desenhadas antes, eu peço.
8. **Preço de componente.** O protótipo escondia o preço de componentes. O backend permite componente com preço (vira avulso também). A spec acrescenta a caixa "Vender também avulsa" no formulário de opção (seção 11.4).
9. **Resumo de pedidos sem itens.** `GET /pedidos` devolve só o resumo; os itens exigem uma chamada por pedido (seção 11.1). Se isso pesar com muitos pedidos, **reportar** como pedido de backend (incluir os itens no resumo, ou um parâmetro para isso). Não alterar o backend.
10. **Confirmação não recarrega do servidor.** `GET /pedidos/{id}` passou a exigir `VerPedidos`, então o cliente só tem a resposta do `POST /pedidos` (seção 12.5).
11. **Dados fictícios.** O número do pedido "27" e todos os nomes, telefones, valores e itens dos protótipos são falsos. Nada disso vai para o código. A ilustração e as bolinhas coloridas são placeholders de foto.
12. **Textos do protótipo que não existem em produção:** nenhum slogan novo deve ser inventado além do que está na seção 17.
