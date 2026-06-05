import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getRecords, getRecord, updateRecord } from './api.ts'

const mockRecord = {
  id: 1,
  name: 'Alice Smith',
  accountId: 'ACC-001',
  description: 'Home Loan',
  status: 'open' as const,
  rate: 5.0,
  balance: 1000,
  deposit: 200,
}

function mockFetch(ok: boolean, data?: unknown): void {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(data),
  }))
}

describe('getRecords', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('returns array of records on success', async () => {
    mockFetch(true, [mockRecord])
    const result = await getRecords()
    expect(result).toEqual([mockRecord])
    expect(vi.mocked(fetch)).toHaveBeenCalledWith('/api/records')
  })

  it('throws on non-ok response', async () => {
    mockFetch(false)
    await expect(getRecords()).rejects.toThrow('Failed to fetch records')
  })
})

describe('getRecord', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('returns single record by id', async () => {
    mockFetch(true, mockRecord)
    const result = await getRecord(1)
    expect(result).toEqual(mockRecord)
    expect(vi.mocked(fetch)).toHaveBeenCalledWith('/api/records/1')
  })

  it('throws on not found', async () => {
    mockFetch(false)
    await expect(getRecord(99)).rejects.toThrow('Record not found')
  })
})

describe('updateRecord', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('sends PUT with correct url, method, headers, and body', async () => {
    const updated = { ...mockRecord, name: 'Alice Updated' }
    mockFetch(true, updated)
    const result = await updateRecord(1, { name: 'Alice Updated' })
    expect(result.name).toBe('Alice Updated')
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      '/api/records/1',
      expect.objectContaining({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Alice Updated' }),
      })
    )
  })

  it('throws on update failure', async () => {
    mockFetch(false)
    await expect(updateRecord(1, {})).rejects.toThrow('Failed to update record')
  })
})
