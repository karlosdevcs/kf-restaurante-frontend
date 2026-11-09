# KF Restaurante: frontend

Interface web do KF Restaurante, feita em React. Tem duas áreas no mesmo app:

- **`/`: cliente.** Vê o cardápio de hoje, monta a marmita, preenche os dados e finaliza. O pedido termina num botão que abre o WhatsApp da loja com a mensagem pronta.
- **`/loja`: painel da loja.** Pedidos do dia, abrir/fechar a loja, esgotar itens, montar o cardápio e cadastrar opções.

Consome a API em [KFRestaurante](https://github.com/karlosdevcs/KFRestaurante) (.NET 8). O contrato dos dados está em `src/types/api.ts`, espelhando campo a campo os DTOs do backend.

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS 3 · React Router. Sem Redux: o estado é local, e o carrinho vive num Context.

## Como rodar

Pré-requisitos: Node.js 20 ou mais novo, e a API rodando (veja o README do backend).

```bash
npm install
cp .env.example .env.local   # ajuste VITE_API_URL se a API não estiver em localhost:5000
npm run dev                  # http://localhost:5173
```

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com recarga automática |
| `npm run build` | Confere os tipos (`tsc`) e gera o build de produção em `dist/` |
| `npm run preview` | Serve o build de produção localmente |
| `npm run lint` | Roda o oxlint |

### Variáveis de ambiente

| Variável | Para que serve | Padrão |
|---|---|---|
| `VITE_API_URL` | Endereço da API, sem barra no final | `http://localhost:5000` |

O número do WhatsApp da loja **não** é configurado aqui: ele fica guardado na API (`PUT /restaurante/whatsapp`, editável na aba **Hoje** do painel), e cada pedido já volta com o link `wa.me` montado.

> **CORS:** a API só aceita origens liberadas em `Cors:OrigensPermitidas` no `appsettings.json` do backend. A porta 5173 (Vite) já vem liberada. Ao publicar o front, inclua o domínio dele lá.

## Como funciona o fluxo do cliente

1. `GET /cardapios/hoje` + `GET /restaurante` + `GET /tamanhos` ao abrir. Sem cardápio publicado, ou com a loja fechada, o cliente vê um aviso e não há carrinho.
2. Escolhe o tamanho e marca os componentes. A tela já bloqueia o que passaria do limite total ou do limite por categoria do tamanho (esses limites vêm da API).
3. O carrinho fica só no navegador. Nada vai para o servidor até **Finalizar pedido**.
4. `POST /pedidos`. Se a API recusar (por exemplo, "Feijoada está esgotada."), a mensagem aparece junto ao botão.
5. Na confirmação, **Enviar no WhatsApp** chama `POST /pedidos/{id}/enviado` e abre o `linkWhatsApp`. Se o aviso falhar, o link abre do mesmo jeito: o envio do cliente nunca fica preso a isso.

As validações da tela (nome, telefone com 10 ou 11 dígitos, endereço na entrega, troco maior que o total) são só para guiar o cliente. **Quem decide é a API**, que valida tudo de novo.

## Layout responsivo

Um único conjunto de componentes serve celular e desktop. O ponto de quebra é 768px:

- **Abaixo:** coluna única. O cliente segue em telas (cardápio, montar marmita, carrinho) e a loja usa uma barra de abas no rodapé.
- **Acima:** duas colunas, com o carrinho fixo ao lado do conteúdo, e abas no topo na área da loja.

## Estrutura

```
src/
  api/          client central (fetch + ApiError) e uma função tipada por endpoint
  types/        tipos que espelham os DTOs e enums do backend
  carrinho/     estado do carrinho (Context + hook useCarrinho)
  cliente/      telas do cliente
  loja/         abas do painel da loja
  components/   peças compartilhadas (Logo, Pill, Feedback...)
  utils/        formatação (moeda, telefone, hora de Brasília)
```

## Limitações conhecidas

- **A área da loja (`/loja`) não tem login.** Qualquer pessoa que souber o endereço consegue abrir o painel, publicar cardápio e alterar o WhatsApp da loja. Por enquanto isso é aceitável para um piloto; antes de uso real é preciso autenticação no front **e** nos endpoints do backend (esconder a rota não protege a API).
- **O envio pelo WhatsApp não é confirmado.** O link abre a conversa com a mensagem pronta, mas quem toca em "enviar" é o cliente. Por isso o pedido existe como *Gerado* até o cliente tocar no botão, e a loja pode chamá-lo pelo painel.
- **Cardápio em rascunho não é reaberto pela tela.** `GET /cardapios/hoje` só devolve cardápio publicado ou fechado. Por isso a aba Cardápio oferece **Criar e publicar** em um passo, e a lista de opções não é editável depois de criada (a API não tem esse endpoint).
- **A lista de pedidos não traz os itens.** `GET /pedidos` devolve só o resumo; os itens são buscados quando a loja clica em **Ver itens**.
- **Tamanhos são só leitura** na interface. Para alterar, use a API.
- **Atualização por polling**, a cada 45 segundos (ou no botão Atualizar). Não há notificação de pedido novo.
- **Sem fotos dos pratos:** as categorias usam um círculo colorido no lugar.
