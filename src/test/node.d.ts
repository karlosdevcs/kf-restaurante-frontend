// Tipos minimos do Node usados so pelos testes que leem arquivos do projeto (evita instalar @types/node).
declare module 'node:fs' {
  export function readFileSync(caminho: string, codificacao: 'utf-8'): string
}
