// junta nomes de classe ignorando valores falsos: cx('a', cond && 'b', undefined) -> 'a b'
export function cx(...partes: Array<string | false | null | undefined>): string {
  return partes.filter(Boolean).join(' ')
}
