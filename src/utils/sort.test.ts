import { describe, it, expect } from 'vitest'
import { sortBy } from './sort.ts'

describe('sortBy', () => {
  const records = [
    { id: 11, name: 'Charlie' },
    { id: 2,  name: 'Alice' },
    { id: 5,  name: 'Bob' },
  ]

  it('sorts numbers ascending', () => {
    const result = sortBy(records, 'id', 'asc')
    expect(result.map(r => r.id)).toEqual([2, 5, 11])
  })

  it('sorts numbers descending', () => {
    const result = sortBy(records, 'id', 'desc')
    expect(result.map(r => r.id)).toEqual([11, 5, 2])
  })

  it('sorts strings ascending case-insensitively', () => {
    const result = sortBy(records, 'name', 'asc')
    expect(result.map(r => r.name)).toEqual(['Alice', 'Bob', 'Charlie'])
  })

  it('sorts strings descending', () => {
    const result = sortBy(records, 'name', 'desc')
    expect(result.map(r => r.name)).toEqual(['Charlie', 'Bob', 'Alice'])
  })

  it('coerces numeric strings so 11 sorts after 2 ascending', () => {
    const items = [{ val: '11' }, { val: '2' }, { val: '5' }]
    const result = sortBy(items, 'val', 'asc')
    expect(result.map(r => r.val)).toEqual(['2', '5', '11'])
  })

  it('coerces numeric strings descending', () => {
    const items = [{ val: '11' }, { val: '2' }, { val: '5' }]
    const result = sortBy(items, 'val', 'desc')
    expect(result.map(r => r.val)).toEqual(['11', '5', '2'])
  })

  it('does not mutate the original array', () => {
    const original = [...records]
    sortBy(records, 'id', 'desc')
    expect(records).toEqual(original)
  })

  it('handles single-element array', () => {
    const single = [{ id: 1, name: 'Solo' }]
    expect(sortBy(single, 'id', 'asc')).toEqual(single)
  })

  it('handles equal values (stable-ish)', () => {
    const items = [{ id: 1, name: 'B' }, { id: 1, name: 'A' }]
    const result = sortBy(items, 'id', 'asc')
    expect(result.map(r => r.id)).toEqual([1, 1])
  })
})
