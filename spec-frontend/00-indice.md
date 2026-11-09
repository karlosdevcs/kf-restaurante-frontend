# KF Restaurante: spec do frontend em React (Conceito 2, minimalista e moderno)

Versão 2. Escrita lendo o repositório do backend na branch `main` (commit `c5bad65`, "docs: documenta login, permissoes por usuario e rotas protegidas"). Substitui a versão anterior, que ainda não conhecia login, permissões, a mensagem do WhatsApp gerada pela API nem o formato real dos contratos.

## 0. Como ler e executar esta spec

- Este documento descreve o frontend completo do KF Restaurante no estilo "Conceito 2" (minimalista e moderno), já aprovado em protótipo clicável. Cobre as duas áreas (cliente e loja), cada uma em celular e em computador, mais o login e a gestão de usuários da loja.
- **Fonte de verdade visual:** os 4 arquivos em `frontend/referencia-conceito2/`, de um editor de protótipos (formato `.dc.html`). Servem só de leitura: o HTML e os estilos inline mostram medidas, cores e estrutura exatas. Não executar esses arquivos e não copiar a sintaxe deles (`{{ }}`, `sc-for`, `sc-if`, `x-dc`). Se um número deste texto divergir do arquivo, vale este texto (ele já incorpora os ajustes da seção 15). Se ainda ficar dúvida, me perguntar.
  - `Conceito2.dc.html`: cliente no computador
  - `Conceito2Mobile.dc.html`: cliente no celular (fluxo em 4 telas)
  - `Conceito2LojaWeb.dc.html`: painel da loja no computador
  - `Conceito2LojaMobile.dc.html`: painel da loja no celular
- **O protótipo não tem** a tela de login, a gestão de usuários, "Minha conta", a edição de opções e tamanhos, o campo do WhatsApp da loja, os estados de carregamento e erro e o formulário de finalização do desktop. Essas telas estão especificadas aqui, reaproveitando os componentes e tokens do Conceito 2 (seções 10 e 11).
- **Fonte de verdade dos dados:** o código do backend (.NET 8) neste repositório. Os contratos já foram levantados na seção 13, mas conferir no código antes de usar, porque o backend evolui. Nunca supor campo, rota, verbo ou formato de resposta.
- **O backend é meu projeto de estudo.** Se faltar um endpoint ou campo, não alterar o backend por conta própria: parar, descrever a lacuna e me perguntar.
- Regras de trabalho:
  - Um commit por entrega, mensagem no padrão `tipo: descrição`, em português, verbo no presente.
  - Não adicionar bibliotecas fora da lista da seção 3 sem me perguntar.
  - Quando uma decisão for de produto (e não técnica), parar e perguntar. As lacunas conhecidas estão na seção 16.
  - Não verificar visualmente com screenshots automáticos a menos que eu peça. Rodar build, lint e testes é esperado.

## 1. Pontos de partida no repositório (backend)

Para quem for escrever o React, os pontos de partida no repositório são:

- A tabela de rotas com a coluna **Acesso** e a seção **"Login e permissões por usuário"** no `README.md` do backend.
- `Dominio/Permissao.cs`, com os nomes das seis permissões, que a API devolve como texto.
- `GET /auth/eu`, que o front chama ao abrir para saber quem é o usuário e quais abas mostrar.
- Qualquer chamada protegida sem token, ou sem a permissão, volta **401** ou **403** no formato `ProblemDetails`.

Complementos que já foram lidos e valem como mapa de leitura:

- Rotas, um arquivo por recurso: `Endpoints/AuthEndpoints.cs`, `UsuariosEndpoints.cs`, `OpcoesEndpoints.cs`, `TamanhosEndpoints.cs`, `CardapiosEndpoints.cs`, `RestauranteEndpoints.cs`, `PedidosEndpoints.cs`.
- Contratos: `DTOs/` (um `record` por request e por response).
- Regras: `Dominio/` (`Pedido.cs`, `Marmita.cs`, `CardapioDoDia.cs`, `Restaurante.cs`, `Usuario.cs`, `Categoria.cs`).
- Quem pode o quê: `Infraestrutura/Autenticacao/Autorizacao.cs` e o teste `KFRestaurante.Tests/Seguranca/EndpointsProtegidosTests.cs`, que lista a política de cada rota.
- Erros: `Infraestrutura/ManipuladorDeExcecoes.cs` (a tradução para `ProblemDetails`) e o `UseStatusCodePages()` em `Program.cs`, que faz 401, 403 e 404 sem corpo também saírem como `ProblemDetails`.
- CORS e configuração: `appsettings.json` (`Cors:OrigensPermitidas`) e `Program.cs`.

## 2. Objetivo e escopo

Uma marmitaria pequena publica o cardápio do dia, o cliente monta a marmita (ou pede só um item avulso) e finaliza, sem login. O pedido é gravado na API, que devolve a mensagem do WhatsApp pronta e o link `wa.me`. A loja entra com login, e **cada usuário vê e faz só o que as permissões dele liberam**: acompanhar pedidos, marcar o que esgotou, abrir e fechar a loja, montar e publicar o cardápio, manter cadastros, alterar o WhatsApp da loja e, para dono e superuser, gerenciar usuários.

**Entra nesta versão**
- Área do cliente em `/` (celular e computador), sem login
- Login em `/loja/entrar`, sessão com JWT, "Minha conta" (trocar senha)
- Painel da loja em `/loja`, com abas por permissão: Pedidos, Hoje, Cardápio, Cadastros, Usuários
- Integração real com a API, incluindo 401 e 403

**Não entra (anotar no README como limitações conhecidas)**
- Refresh token e "lembrar de mim" por mais de 12h (a API não tem: o token dura 12 horas)
- Criação de superuser pela interface (só pela configuração do backend)
- Notificação push, som ou WebSocket de pedido novo (só polling)
- Upload de foto de prato (o protótipo usa ilustração e bolinhas coloridas por categoria)
- Exclusão de opções, tamanhos, cardápios e usuários (a API não tem endpoint de exclusão; só desativar usuário)
- Troca de fundo ou tema
- Busca de pratos
- Integração com a API oficial do WhatsApp (só o link `wa.me` que a API devolve)
- Recuperação de senha por e-mail (quem gerencia a pessoa redefine a senha dela)

## Como esta spec está dividida

A spec original era grande demais para um arquivo só. Ela foi dividida em arquivos menores, **sem mudar o conteúdo nem a numeração das seções**. As referências do tipo "seção 12.2" continuam valendo: use a tabela abaixo para achar o arquivo.

**Ordem de leitura e execução:** leia este índice inteiro e depois cada parte na ordem. Não é preciso carregar todas de uma vez: ao implementar uma fase, leia as partes que ela usa (a coluna "Usa nas fases" mostra quais). Os tokens da parte 01 e os componentes da parte 02 valem para todas as telas.

| Arquivo | Seções | Conteúdo | Usa nas fases (seção 20) |
|---|---|---|---|
| `00-indice.md` | 0, 1, 2 | Como ler, pontos de partida no repositório, escopo | todas |
| `01-base.md` | 3 a 7 | Stack, estrutura, tokens, tipografia, ícones, layout, breakpoints e rotas | 1, 2 |
| `02-componentes.md` | 8 | Componentes base com medidas | 2 |
| `03-cliente.md` | 9 | Área do cliente, computador e celular | 4, 5 |
| `04-login-e-permissoes.md` | 10 | Login, sessão, 401 e 403, permissões e abas | 3 |
| `05-loja-pedidos-hoje-cardapio.md` | 11.1 a 11.3 | Abas Pedidos, Hoje e Cardápio | 6, 7 |
| `06-loja-cadastros-usuarios-conta.md` | 11.4 a 11.6 | Abas Cadastros e Usuários, e Minha conta | 8, 9 |
| `07-regras-e-api.md` | 12, 13 | Regras de negócio no front e contrato da API | 3 a 9 |
| `08-estados-acessibilidade-lacunas.md` | 14, 15, 16 | Estados de carregamento, vazio e erro, acessibilidade, lacunas | 10 |
| `09-textos-testes-entrega.md` | 17 a 21 | Textos, testes, ordem de execução, critérios de aceite e entregáveis | 10, 11 |

**Seções 20 e 21 (ordem de execução e entregáveis) estão em `09-textos-testes-entrega.md`.** Comece por lá se quiser ver o plano de fases antes de ler o resto.
