# KF Restaurante, spec do frontend (parte 9 de 9): Textos, testes, ordem de execução e entregáveis

Ler primeiro o `00-indice.md`. Esta parte faz parte de uma spec dividida em arquivos; as referências a "seção N" apontam para o número da seção, e o índice diz em qual arquivo cada seção está.

## 17. Textos (microcopy) de referência

**Cliente**
- Cabeçalho: "Aberto" / "Fechado"
- Seções: "Categoria da marmita" (desktop), "Monte sua marmita", "Hoje tem", "Pra acompanhar", "Meu pedido", "Seu pedido vai aparecer aqui." (carrinho vazio desktop)
- Títulos de tela (celular): "Marmita {tamanho}", "Meu pedido"
- Botões: "Montar minha marmita", "Ver pedido · {n} itens", "Adicionar", "Adicionar ao pedido", "Continuar escolhendo", "Cardápio" (voltar, só no celular), "Finalizar pedido", "Confirmar pedido" (desktop), "Enviar no WhatsApp", "Fazer outro pedido"
- Apoio: "Escolha pelo menos um item", "O pedido chega no WhatsApp da loja.", "Este item acabou. Remova para continuar."
- Rótulos: "TAMANHO", "MONTE SUA MARMITA · {n}/{limite}", "Nome", "WhatsApp", "Como você recebe", "Retirada", "Entrega", "Endereço", "Ponto de referência", "Pagamento", "Pix", "Dinheiro", "Débito", "Crédito", "Troco para quanto?", "Observação"
- Confirmação: "Pedido nº {numero} registrado", "Agora é só enviar pro WhatsApp da loja. Ela confirma por lá."

**Login e conta**
- "Entrar", "Área da loja", "E-mail", "Senha", "Mostrar", "Ocultar", "Entrando...", "Esqueceu a senha? Peça ao dono da loja para redefinir."
- "Sua sessão expirou. Entre de novo."
- "Você não tem permissão para fazer isso."
- "Você ainda não tem acesso a nada por aqui", "Peça ao dono da loja para liberar as suas permissões."
- "Minha conta", "Sair", "Trocar senha", "Senha atual", "Nova senha", "Confirmar nova senha", "Senha alterada.", "Errar a senha atual 5 vezes bloqueia a conta por 15 minutos."

**Loja**
- Abas: "Pedidos", "Hoje", "Cardápio", "Cadastros", "Usuários"
- Títulos: "Pedidos de hoje", "Hoje" (celular), "Cardápio do dia", "Cadastros", "Opções", "Tamanhos", "Usuários", "Acabou alguma coisa?"
- Apoio: "O mais recente aparece primeiro", "Um toque e o cliente vê na hora.", "Sem cardápio publicado hoje.", "Nenhum pedido ainda hoje.", "Nenhum pedido nesse filtro."
- Estado da loja: "Loja aberta" / "Loja fechada"; descrições e botões da seção 11.2; "WhatsApp da loja", "Não cadastrado", "A loja só abre com o WhatsApp cadastrado."
- Toggles: "Disponível" / "Esgotado"
- Pedido: "Enviado" / "Não enviado"; "Chamar no WhatsApp"
- Cardápio: "Criar cardápio", "Publicar cardápio", "Fechar cardápio", "Reabrir cardápio", "Rascunho", "Publicado", "Fechado"
- Cadastro: "Nova opção", "Salvar opção" (web) / "Salvar" (celular), "Cancelar", "Vender também avulsa", "Componente de marmita não tem preço próprio. Entra no preço do tamanho.", "componente" (coluna de preço), "Novo tamanho", "Limitar"
- Usuários: "Novo usuário", "Criar usuário", "Editar", "Desativar", "Ativar", "Redefinir senha", "Ativo", "Inativo", "Você", "Todas", "A pessoa troca a senha depois, em Minha conta.", "Desativar {nome}?", "A pessoa perde o acesso na hora.", "Senha redefinida. A conta também foi destravada."
- Papéis: "Funcionário", "Dono", "Superuser"

## 18. Testes

Obrigatórios (Vitest + React Testing Library; MSW para a API):
1. `regrasMarmita`: bloqueio por total, por categoria, por esgotado e por máximo 0; troca de tamanho com corte de excedentes (casos: excesso de carnes, excesso de total, nada a cortar).
2. Validação do formulário do cliente: as 5 pendências na ordem certa; telefone com e sem máscara; entrega com e sem endereço; troco menor que o total.
3. Montagem do payload de `POST /pedidos`: avulso e marmita, retirada e entrega (endereço e referência só na entrega), troco só em dinheiro.
4. `categoriaConfig`: `Guarnicao` vira "Guarnição"; categoria desconhecida não quebra; ordem dos grupos.
5. Mapeamento `Gerado`/`Enviado` para rótulo e cor; contadores dos filtros da loja.
6. `formatBRL`, hora em fuso de São Paulo a partir de UTC (com e sem `Z`), singular e plural, telefone, WhatsApp da loja.
7. **Login e sessão:** login com sucesso guarda a sessão e vai para a primeira aba permitida; login com 401 mostra a mensagem da API e limpa a senha; sem sessão, `/loja` redireciona para `/loja/entrar`; sessão vencida limpa e redireciona; sair limpa o cache.
8. **401 e 403:** um 401 em chamada protegida desloga com a mensagem de sessão expirada; um 403 mostra a mensagem, refaz `GET /auth/eu` e não desloga; o token só é enviado nas chamadas da loja (as do cliente não levam `Authorization`).
9. **Permissões:** para cada permissão, a aba ou o bloco correspondente aparece e some conforme `GET /auth/eu`; funcionário sem permissões vê a tela "sem acesso"; permissão desconhecida não quebra; aba Usuários só para `Dono` e `Superuser`; `StatusButton` vira informativo sem `AbrirFecharLoja`; a coluna "Acabou alguma coisa?" some sem `EsgotarOpcoes`.
10. **Usuários:** dono só pode criar `Funcionario`; checkbox de permissão desabilitado quando quem edita não a tem e o editado também não; manter permissão que o editado já tinha continua habilitado; linha própria sem ações de desativar e redefinir; criar com e-mail duplicado mostra o 409.
11. Componente: montar marmita respeita os limites e mostra o contador.
12. **Fluxo do cliente:** finalizar pedido chama `POST /pedidos` com o payload correto, mostra erro 400, usa `mensagemWhatsApp` e `linkWhatsApp` da resposta, e o clique em "Enviar no WhatsApp" dispara `POST /pedidos/{id}/enviado` sem impedir o link de abrir, mesmo se a chamada falhar.
13. **Cardápio da loja:** estados sem cardápio, rascunho, publicado e fechado mostram o botão certo; 409 ao criar mostra a explicação; reabrir chama `/publicar`.

Não é necessário teste ponta a ponta nem de snapshot visual nesta versão.

## 19. Pontos que dependem de conferir o código antes de usar

Os contratos da seção 13 já foram lidos, mas o backend evolui. Antes de implementar cada tela, **abrir o arquivo real** e confirmar. Se algo divergir, o código vence e a spec precisa ser ajustada (avisar):

1. `DTOs/UsuarioResponse.cs` e `Dominio/Permissao.cs`: nomes exatos das permissões e dos papéis (o front usa um mapa de rótulos e tolera valores novos).
2. `DTOs/PedidoResponse.cs`, `PedidoResumoResponse.cs` e `CriarPedidoRequest.cs`: campos de cada um (a seção 12.5 e a 11.1 dependem disso).
3. `Endpoints/CardapiosEndpoints.cs`: a regra de rascunho e o 404 de `GET /cardapios/hoje` (a seção 11.3 depende disso).
4. `Endpoints/PedidosEndpoints.cs`: a proteção de `GET /pedidos/{id}` (a confirmação do cliente depende de ela ser protegida).
5. `Program.cs` e `appsettings.json`: origens de CORS e o `UseStatusCodePages()` que garante `ProblemDetails` em 401 e 403.
6. `KFRestaurante.Tests/Seguranca/EndpointsProtegidosTests.cs`: a lista de políticas por rota. Se aparecer rota nova, o front precisa decidir quem a usa.

**Decisões que são minhas, não do código:** o padrão do formulário no desktop, a navegação do topo, a porção dupla e os textos dos botões (seção 16). Se uma dessas decisões travar o trabalho, perguntar em vez de escolher sozinho.

## 20. Ordem de execução e critérios de aceite

**Fases (um commit por fase, no mínimo)**
1. Projeto base: Vite, TypeScript, Tailwind, tokens, fonte, rotas vazias, client de API (com `ProblemDetails`, 401 e 403) e `.env.example`.
2. Átomos de `components/ui/` e a página de catálogo de componentes interna (rota `/_ui`, só em desenvolvimento) para conferir cada estado.
3. Autenticação: `AuthProvider`, login, sessão, guardas de rota, `GET /auth/eu`, `UserMenu`, "Minha conta" e "sem acesso".
4. Cliente celular: telas 1 a 4 com dados reais.
5. Cliente desktop: página única com carrinho lateral e formulário embutido.
6. Loja: shell (cabeçalho, status, abas por permissão) e aba Pedidos (celular e web).
7. Loja: abas Hoje e Cardápio.
8. Loja: aba Cadastros (opções, tamanhos e limites).
9. Loja: aba Usuários.
10. Estados de carregamento, vazio e erro; ajustes de acessibilidade da seção 15.
11. Testes da seção 18 e README.

**Critérios de aceite (conferir antes de dar por pronto)**
- [ ] Os 4 fluxos (cliente celular, cliente desktop, loja celular, loja desktop) funcionam contra a API real.
- [ ] Sem login, `/loja` leva a `/loja/entrar`; o cliente (`/`) funciona sem login e sem enviar token.
- [ ] Login com e-mail e senha corretos entra na primeira aba permitida; credencial errada mostra a mensagem da API, sem pistas.
- [ ] Cada usuário vê só as abas e os blocos que as permissões dele liberam; mudar as permissões na API reflete na tela sem novo login (após `GET /auth/eu`).
- [ ] 401 desloga com mensagem; 403 mostra mensagem sem deslogar; nenhuma tela fica em branco.
- [ ] Sair limpa a sessão e o cache; nenhum dado da loja aparece depois.
- [ ] Dono cria só funcionário e só concede permissão que tem; superuser cria qualquer papel; ninguém desativa a si mesmo na interface.
- [ ] Trocar a própria senha funciona e o aviso do bloqueio por tentativas aparece.
- [ ] Nenhum dado fictício dos protótipos aparece no código ou na tela.
- [ ] Os limites de total e por categoria bloqueiam e liberam corretamente, e a troca de tamanho segue a seção 12.2.
- [ ] Um pedido finalizado aparece na aba Pedidos da loja como "Não enviado"; ao tocar em "Enviar no WhatsApp" vira "Enviado" depois do próximo refresh.
- [ ] A mensagem mostrada ao cliente é exatamente a `mensagemWhatsApp` devolvida pela API, e o botão abre o `linkWhatsApp`.
- [ ] Marcar "Esgotado" na loja reflete no cliente depois do próximo recarregamento do cardápio.
- [ ] Loja fechada ou cardápio encerrado bloqueia o pedido no cliente e mostra a faixa e o selo.
- [ ] Todo erro 400, 401, 403, 404, 409 e de rede tem mensagem legível, sem `alert` e sem tela em branco.
- [ ] Navegação por teclado completa nas duas áreas, com foco visível; todos os campos têm label; contraste conforme a seção 15.
- [ ] Layout correto em 390px, 768px, 1024px e 1440px de largura, sem rolagem horizontal da página.
- [ ] `npm run build`, `lint` e `test` passam sem aviso.

## 21. Entregáveis

1. Projeto em `frontend/`, rodando com `npm run dev`.
2. `.env.example` e `README.md` do frontend, com:
   - como rodar, variáveis de ambiente e o que fazer no backend para o login funcionar (user-secrets do JWT e do superuser, conforme o README do backend);
   - mapa de rotas e a tabela de abas por permissão;
   - decisões importantes registradas: por que o token fica em `sessionStorage` e não em `localStorage`, por que o front esconde mas a API é quem protege, por que `Gerado`/`Enviado`, por que a mensagem do WhatsApp vem da API, por que o formulário fica embutido no carrinho do desktop;
   - limitações conhecidas (a lista da seção 2) e as lacunas de backend encontradas (seção 16, itens 4 e 9).
3. Os 4 arquivos de referência em `frontend/referencia-conceito2/` (se eu não os tiver colocado lá, avisar).
4. Lista final de lacunas do backend encontradas durante a implementação, para eu decidir o que fazer.
