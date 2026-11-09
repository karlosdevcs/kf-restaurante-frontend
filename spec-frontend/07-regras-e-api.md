# KF Restaurante, spec do frontend (parte 7 de 9): Regras de negócio no frontend e contrato da API

Ler primeiro o `00-indice.md`. Esta parte faz parte de uma spec dividida em arquivos; as referências a "seção N" apontam para o número da seção, e o índice diz em qual arquivo cada seção está.

## 12. Regras de negócio no frontend

Estas regras espelham o backend para dar resposta imediata, mas **o backend continua sendo a autoridade**: sempre tratar o erro de domínio devolvido pela API.

### 12.1 Categorias (configuração centralizada)
A API devolve a categoria como texto (o enum `Categoria`). Valores reais: `Carne`, `Acompanhamento`, `Guarnicao` (**sem cedilha**), `Salada`, `Bebida`, `Sobremesa`. Centralizar num único mapa `categoriaConfig` (`lib/categoriaConfig.ts`), indexado pelo valor da API:

| Valor da API | Rótulo | Rótulo curto (celular, formulários) | Componente de marmita | Ordem nos grupos | Cor |
|---|---|---|---|---|---|
| `Carne` | Carne | Carne | sim | 1 | `#F3D8CF` |
| `Acompanhamento` | Acompanhamento | Acomp. | sim | 2 | `#FBE7B8` |
| `Guarnicao` | Guarnição | Guarnição | sim | 3 | `#E6D9C2` |
| `Salada` | Salada | Salada | sim | 4 | `#D8E8CB` |
| `Bebida` | Bebida | Bebida | **não** | | `#D7E6F2` |
| `Sobremesa` | Sobremesa | Sobremesa | **não** | | `#F2D9E8` |

Os números do enum no backend (`Carne = 0`, `Bebida = 2`...) **não** são a ordem de exibição; não depender deles. Uma categoria desconhecida deve aparecer com o próprio nome, cor `#EEF0F3`, tratada como componente, sem quebrar.

### 12.2 Montar marmita
- Limite total = `limitedeComponente` do tamanho.
- Limites por categoria = `limites` do `TamanhoResponse` (`[{ categoria, maximo }]`). Categoria sem entrada na lista não tem limite próprio (vale só o total). `maximo` 0 bloqueia a categoria inteira.
- Um tile fica **bloqueado** quando: não está marcado **e** (está esgotado **ou** o total atingiu o limite **ou** a categoria atingiu o limite).
- Marcar e desmarcar são livres (toggle). Ordem de seleção = ordem em que foram marcados. Adicionar exige pelo menos 1 ingrediente.
- **Trocar de tamanho com seleção feita:**
  1. Para cada categoria com limite menor que o número de itens marcados nela, remover os excedentes, começando pelos marcados por último.
  2. Depois, se o total exceder o limite do novo tamanho, cortar mantendo os primeiros marcados, na ordem de seleção.
  3. O que sobrar permanece marcado.
- **Porção dupla:** a API aceita o mesmo componente mais de uma vez na mesma marmita (`[1, 1, 11]`, e a dupla conta como 2 no limite da categoria). O protótipo só tem toggle (uma porção por componente). **Esta versão não implementa porção dupla** (seção 16, item 6). Cada componente vai uma vez só em `componentesIds`.

### 12.3 Validação do formulário do cliente (ordem de verificação e texto exato)
A primeira pendência encontrada vira a mensagem acima do botão, e o botão "Finalizar pedido" fica desabilitado.
1. Carrinho vazio: `Adicione pelo menos um item`
2. Nome vazio (após `trim`): `Preencha seu nome pra finalizar`
3. WhatsApp com menos de 10 dígitos (contar só dígitos): `Preencha seu WhatsApp com DDD`
4. Entrega sem endereço: `Preencha o endereço de entrega`
5. Troco preenchido e menor que o total: `O troco precisa ser maior ou igual ao total ({total}).`

Telefone: aceitar máscara livre na digitação; a API aceita com ou sem máscara e exige 10 ou 11 dígitos. Troco só aparece com pagamento "Dinheiro", é opcional (vazio = sem troco) e aceita vírgula ou ponto. Referência só aparece com "Entrega"; ao trocar para "Retirada", limpar endereço e referência do payload. O backend também valida; mostrar a mensagem de domínio que ele devolver (seção 14).

### 12.4 Mensagem do WhatsApp: vem pronta da API
**O front não monta a mensagem.** A resposta de `POST /pedidos` traz `mensagemWhatsApp` (o texto) e `linkWhatsApp` (o `wa.me` da loja com o texto já codificado). Exemplo do que chega:
```
*Pedido nº 14*
08/11/2026 às 20:00
Cliente: Maria · (31) 98888-7777

1x Feijoada — R$ 25,00
2x Marmita M — R$ 40,00
   Arroz, Arroz, Feijão Tropeiro

*Total: R$ 65,00*

Pagamento: Dinheiro – troco para R$ 100,00
Entrega: Rua A, 10
Referência: portão azul, ao lado da padaria

Obs.: sem cebola na feijoada
```
- Mostrar `mensagemWhatsApp` na caixa da confirmação, como texto puro (`white-space: pre-line`). Nunca como HTML.
- `linkWhatsApp` pode vir **nulo** (loja sem número cadastrado). Como a loja só abre com o número, é um caso defensivo: mostrar a mensagem e desabilitar "Enviar no WhatsApp" com o texto de apoio "A loja ainda não cadastrou o WhatsApp. Avise a loja pelo telefone."
- O formato da mensagem é da API (`Servicos/MensagemWhatsApp.cs`). Qualquer mudança de formato é no backend.

### 12.5 Finalizar pedido e enviar
1. Validar no cliente (12.3).
2. `POST /pedidos` com o payload:
```
{
  nomeCliente, telefone, cardapioId,
  formaDePagamento,        // "Pix" | "Dinheiro" | "CartaoDeDebito" | "CartaoDeCredito"
  trocoPara,               // número ou null (só dinheiro)
  tipoDeEntrega,           // "Retirada" | "Entrega"
  endereco, referencia,    // só entrega; senão null
  observacao,              // ou null
  itens: [
    { opcaoId, quantidade },                          // avulso
    { tamanhoId, componentesIds: [..], quantidade }   // marmita
  ]
}
```
   Avulso preenche só `opcaoId`; marmita preenche `tamanhoId` e `componentesIds`; nunca os dois. `cardapioId` vem do `GET /cardapios/hoje`.
3. Resposta 201 (`PedidoResponse`): guardar no estado da confirmação **e** em `sessionStorage` (chave `kf:ultimo-pedido`), só para a tela de confirmação sobreviver a um recarregamento acidental; limpar ao tocar "Fazer outro pedido" (a chave some quando a aba fecha). Navegar para `/confirmacao/{numero}`. Se a página for aberta sem esse dado, redirecionar para `/`.
4. **Enviar no WhatsApp:** o botão é um link (`<a href={linkWhatsApp} target="_blank" rel="noopener noreferrer">` com aparência de botão), para o navegador não bloquear a abertura. No clique, **sem esperar**, disparar `POST /pedidos/{id}/enviado` (o pedido passa a "Enviado"; a chamada é aberta, sem login, e idempotente). Falha dessa chamada é silenciosa para o cliente (registrar no console em desenvolvimento) e nunca impede o link de abrir.
5. Erros: 400 com mensagem de domínio em `Banner` acima do botão "Finalizar pedido"; carrinho e formulário continuam preenchidos; depois de qualquer 400, reconsultar restaurante e cardápio (a causa mais comum é loja fechada, cardápio encerrado ou item esgotado).

### 12.6 Formatação
- Moeda: `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`, sempre com duas casas ("R$ 16,00"). O protótipo mistura "R$ 16" e "R$ 16,00"; em produção usar sempre duas casas.
- Hora: HH:mm no fuso `America/Sao_Paulo`. `horaPedido` e `expiraEm` chegam em UTC: tratar como UTC (se a string vier sem `Z`, acrescentar).
- Data do cabeçalho: ex.: "domingo, 8 de novembro" com `Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Sao_Paulo' })`.
- Telefone na tela: `(62) 99812-4471` (11 dígitos) ou `(62) 9812-4471` (10). WhatsApp da loja: `+55 (31) 99999-9999`.
- Rótulos de enum: forma de pagamento `Pix` → "Pix", `Dinheiro` → "Dinheiro", `CartaoDeDebito` → "Débito" (curto) ou "Cartão de débito", `CartaoDeCredito` → "Crédito" ou "Cartão de crédito". Entrega `Retirada` → "Retirada", `Entrega` → "Entrega".
- Singular e plural: "1 item" / "2 itens"; "1 carne" / "2 carnes".

## 13. Contrato da API (levantado do código)

Lido em `Endpoints/` e `DTOs/` na `main`. Conferir no código antes de usar. A tabela de rotas do `README.md` (coluna **Acesso**) e o teste `EndpointsProtegidosTests` são a referência de quem pode o quê.

**Acesso:** **aberta** (sem login), **logado** (qualquer usuário ativo), **gerenciar usuários** (papel `Dono` ou `Superuser`) ou uma **permissão** específica.

| Rota | Acesso | Corpo e resposta principais |
|---|---|---|
| `POST /auth/login` | aberta | `{ email, senha }` → `{ token, expiraEm, usuario }`; 401 com mensagem única |
| `GET /auth/eu` | logado | → `UsuarioResponse` `{ id, nome, email, papel, ativo, permissoes[] }` |
| `POST /auth/trocar-senha` | logado | `{ senhaAtual, novaSenha }` → 204; 400 "Senha atual incorreta." |
| `GET /usuarios`, `GET /usuarios/{id}` | gerenciar usuários | → `UsuarioResponse` (lista) |
| `POST /usuarios` | gerenciar usuários | `{ nome, email, senha, papel, permissoes? }` → 201; 403 e 409 |
| `PUT /usuarios/{id}` | gerenciar usuários | `{ nome, permissoes? }` (substitui) → 200 |
| `POST /usuarios/{id}/desativar`, `/ativar` | gerenciar usuários | → `UsuarioResponse` |
| `PUT /usuarios/{id}/senha` | gerenciar usuários | `{ novaSenha }` → 204 |
| `GET /opcoes`, `GET /opcoes/{id}` | logado | → `OpcaoResponse` `{ id, nome, categoria, preco?, esgotado }` |
| `POST /opcoes`, `PUT /opcoes/{id}` | `GerenciarCadastros` | `{ nome, categoria, preco? }`; 409 em nome duplicado |
| `PATCH /opcoes/{id}/esgotado` | `EsgotarOpcoes` | `{ esgotado }` → `OpcaoResponse` |
| `GET /tamanhos`, `GET /tamanhos/{id}` | **aberta** | → `TamanhoResponse` `{ id, nome, preco, limitedeComponente, limites[{ categoria, maximo }] }` |
| `POST /tamanhos`, `PUT /tamanhos/{id}` | `GerenciarCadastros` | `{ nome, preco, limitedeComponente }`; 409 |
| `PUT /tamanhos/{id}/limites` | `GerenciarCadastros` | `{ limites: [{ categoria, maximo }] }` (substitui) |
| `GET /cardapios/hoje` | **aberta** | → `CardapioResponse` `{ id, dataPublicacao, situacao, opcoes[] }`; 404 se não existe ou é rascunho |
| `POST /cardapios` | `GerenciarCardapio` | `{ opcoesIds }` → 201 (rascunho); 400 e 409 |
| `GET /cardapios/{id}` | `GerenciarCardapio` | → `CardapioResponse` |
| `POST /cardapios/{id}/publicar`, `/fechar` | `GerenciarCardapio` | → `CardapioResponse` (publicar reabre) |
| `GET /restaurante` | **aberta** | → `{ aberto, whatsApp? }` |
| `POST /restaurante/abrir`, `/fechar` | `AbrirFecharLoja` | → `RestauranteResponse`; abrir sem WhatsApp dá 400 |
| `PUT /restaurante/whatsapp` | `AlterarWhatsApp` | `{ whatsApp }` → `RestauranteResponse` |
| `POST /pedidos` | **aberta** | corpo da seção 12.5 → 201 `PedidoResponse` |
| `POST /pedidos/{id}/enviado` | **aberta** | → 204 |
| `GET /pedidos?data=&status=` | `VerPedidos` | → lista de `PedidoResumoResponse` |
| `GET /pedidos/{id}` | `VerPedidos` | → `PedidoResponse` completo |

**Enums chegam como texto** (serialização com `JsonStringEnumConverter`): `Categoria`, `Papel`, `Permissao`, `StatusPedido`, `SituacaoCardapio`, `FormadePagamento`, `TipoDeEntrega`. `Permissoes` e `permissoes` são **listas de nomes**, nunca um número.

**Datas:** `horaPedido`, `expiraEm` em UTC; `dataPublicacao` é `YYYY-MM-DD`. "Hoje" é sempre o hoje de **Brasília** (a API decide).

**Erros:** `ProblemDetails` (`status`, `title`, `detail`):
- 400: regra de negócio (`title`: "Regra de negócio violada.", `detail` com a mensagem) ou JSON inválido ("Requisição inválida.").
- 401: sem token, token inválido ou vencido, usuário inativo (e falha de login).
- 403: sem a permissão ou fora da hierarquia.
- 404: id inexistente (inclusive id que não é número: a rota devolve 404).
- 409: nome ou e-mail ou data duplicados.
- 500: "Erro inesperado." sem detalhe interno.

**CORS:** liberado por `Cors:OrigensPermitidas` (porta 5173 já incluída), qualquer cabeçalho e qualquer método, **sem credenciais**. O token vai no cabeçalho `Authorization: Bearer <token>`.
