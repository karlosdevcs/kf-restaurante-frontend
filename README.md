# KF Restaurante: frontend

Interface web do KF Restaurante em React: o **cliente** monta o pedido em `/` (sem login) e a **loja** gerencia tudo em `/loja` (com login e permissões por usuário). Consome a API em [KFRestaurante](https://github.com/karlosdevcs/KFRestaurante).

> **Em construção.** Este arquivo é o resumo da fase atual. O README completo (rotas, abas por permissão, decisões e limitações) entra na fase 11. O andamento está em [`PROGRESSO.md`](PROGRESSO.md) e a spec em [`spec-frontend/`](spec-frontend/00-indice.md).

## Como rodar

Pré-requisitos: Node.js 20 ou mais novo e a API rodando (veja o README do backend).

```bash
npm install
cp .env.example .env.local   # ajuste VITE_API_URL se a API não estiver em localhost:5000
npm run dev                  # http://localhost:5173
```

Use `http://localhost:5173`: é a origem liberada no CORS do backend (`127.0.0.1` seria bloqueada).

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (porta 5173) |
| `npm run build` | Confere os tipos e gera o build de produção |
| `npm run preview` | Serve o build de produção localmente |
| `npm run lint` | oxlint |
| `npm test` | Vitest (uma execução) |
| `npm run test:watch` | Vitest em modo observação |
