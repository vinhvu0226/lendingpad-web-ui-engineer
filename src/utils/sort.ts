export type SortDir = 'asc' | 'desc'

export function sortBy<T>(items: T[], key: keyof T, dir: SortDir): T[] {
  return [...items].sort((a, b) => {
    const av = a[key]
    const bv = b[key]

    const an = typeof av === 'number' ? av : Number(av)
    const bn = typeof bv === 'number' ? bv : Number(bv)
    if (!isNaN(an) && !isNaN(bn)) {
      return dir === 'asc' ? an - bn : bn - an
    }

    const cmp = String(av).toLowerCase().localeCompare(String(bv).toLowerCase())
    return dir === 'asc' ? cmp : -cmp
  })
}
