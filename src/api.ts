export interface LoanRecord {
  id: number
  name: string
  accountId: string
  description: string
  status: 'open' | 'paid' | 'due' | 'inactive'
  rate: number
  balance: number
  deposit: number
  email: string
  phone: string
}

export async function getRecords(): Promise<LoanRecord[]> {
  const res = await fetch('/api/records')
  if (!res.ok) throw new Error('Failed to fetch records')
  return res.json() as Promise<LoanRecord[]>
}

export async function getRecord(id: number): Promise<LoanRecord> {
  const res = await fetch(`/api/records/${id}`)
  if (!res.ok) throw new Error('Record not found')
  return res.json() as Promise<LoanRecord>
}

export async function updateRecord(id: number, data: Partial<LoanRecord>): Promise<LoanRecord> {
  const res = await fetch(`/api/records/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update record')
  return res.json() as Promise<LoanRecord>
}
