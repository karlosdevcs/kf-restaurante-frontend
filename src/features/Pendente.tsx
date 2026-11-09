// Tela provisoria das fases iniciais: cada rota recebe sua tela real nas fases seguintes.
export function Pendente({ nome }: { nome: string }) {
  return (
    <main className="p-6">
      <p className="text-muted">{nome}: em construção.</p>
    </main>
  )
}
