// Regras fixas de seguranca (spec, 15, "Seguranca no front"), conferidas no codigo-fonte: se alguem quebrar uma delas,
// o teste falha. Os arquivos de teste ficam de fora (eles falam dessas regras). Os fontes entram como texto, pelo
// `import.meta.glob` do Vite, sem precisar dos tipos do Node.

const fontes = import.meta.glob<string>('/src/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true })

// comentarios explicam as regras com as mesmas palavras que elas proibem: so o codigo conta
function semComentarios(texto: string): string {
  return texto
    .split('\n')
    .filter((linha) => !/^\s*(\/\/|\/\*|\*)/.test(linha))
    .map((linha) => linha.replace(/\s\/\/.*$/, ''))
    .join('\n')
}

const codigo = Object.entries(fontes)
  .filter(([caminho]) => !/\.test\.tsx?$/.test(caminho) && !caminho.startsWith('/src/test/'))
  .map(([caminho, texto]) => ({ caminho, texto: semComentarios(texto) }))

const arquivo = (final: string) => codigo.find(({ caminho }) => caminho.endsWith(final))

describe('regras fixas de seguranca no codigo', () => {
  it('encontrou o codigo para conferir', () => {
    expect(codigo.length).toBeGreaterThan(50)
  })

  it('nunca usa dangerouslySetInnerHTML (texto da API sempre como texto)', () => {
    expect(codigo.filter(({ texto }) => texto.includes('dangerouslySetInnerHTML')).map(({ caminho }) => caminho)).toEqual([])
  })

  it('todo link para fora da pagina tem rel="noopener noreferrer"', () => {
    const semRel = codigo.filter(({ texto }) =>
      [...texto.matchAll(/target="_blank"/g)].some((achado) => {
        const inicio = achado.index ?? 0
        // o `rel` pode vir antes ou depois do `target`: olha a janela em volta de cada ocorrencia
        return !texto.slice(Math.max(0, inicio - 200), inicio + 200).includes('rel="noopener noreferrer"')
      }),
    )

    expect(semRel.map(({ caminho }) => caminho)).toEqual([])
  })

  it('nada do app usa localStorage (token e demais dados ficam so em sessionStorage ou na memoria)', () => {
    expect(codigo.filter(({ texto }) => /localStorage/.test(texto)).map(({ caminho }) => caminho)).toEqual([])
  })

  it('a sessao fica em sessionStorage (chave kf:sessao), nunca em localStorage', () => {
    const sessao = arquivo('auth/sessaoGuardada.ts')?.texto ?? ''

    expect(sessao).toContain('sessionStorage')
    expect(sessao).toContain('kf:sessao')
    expect(sessao).not.toContain('localStorage')
  })

  it('o token so e lido no client de API e anexado so nas chamadas da loja', () => {
    const quemLeOToken = codigo.filter(({ texto }) => /Authorization/.test(texto)).map(({ caminho }) => caminho)

    expect(quemLeOToken).toEqual(['/src/api/client.ts'])
  })

  it('nao usa alert, confirm nem prompt (todo erro e mensagem na tela)', () => {
    expect(codigo.filter(({ texto }) => /\b(window\.)?(alert|confirm|prompt)\(/.test(texto)).map(({ caminho }) => caminho)).toEqual([])
  })

  it('so um console.* no codigo, so em desenvolvimento e sem token nem telefone', () => {
    const usos = codigo.flatMap(({ caminho, texto }) => texto.split('\n').filter((linha) => /console\./.test(linha)).map((linha) => ({ caminho, linha })))

    expect(usos).toHaveLength(1)
    expect(usos[0]?.linha).toContain('import.meta.env.DEV')
    expect(usos[0]?.linha).not.toMatch(/token|telefone|senha/i)
  })

  it('a unica variavel de ambiente lida e VITE_API_URL (VITE_* e publico: nunca segredo)', () => {
    const variaveis = new Set(codigo.flatMap(({ texto }) => [...texto.matchAll(/import\.meta\.env\.(\w+)/g)].map((achado) => achado[1])))

    // DEV e a chave do proprio Vite (modo de desenvolvimento)
    expect([...variaveis].sort()).toEqual(['DEV', 'VITE_API_URL'])
  })
})
