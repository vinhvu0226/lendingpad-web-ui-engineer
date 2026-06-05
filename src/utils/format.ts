export function fmt(n: number): string {
  const abs = Math.abs(n).toFixed(2)
  return n < 0 ? `-$${abs}` : `$${abs}`
}

export function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
