import type { LoanRecord } from '../api.ts'
import { fmt, cap } from './format.ts'

const DIFF_FIELDS: Array<{ key: keyof LoanRecord; label: string }> = [
  { key: 'name',    label: 'Full Name' },
  { key: 'email',   label: 'Email Address' },
  { key: 'phone',   label: 'Phone Number' },
  { key: 'status',  label: 'Account Status' },
  { key: 'rate',    label: 'Monthly Rate (CAD)' },
  { key: 'balance', label: 'Current Balance (CAD)' },
  { key: 'deposit', label: 'Deposit Amount (CAD)' },
]

function fmtVal(key: keyof LoanRecord, val: unknown): string {
  if (key === 'rate' || key === 'balance' || key === 'deposit') return fmt(Number(val))
  if (key === 'status') return cap(String(val))
  return String(val ?? '')
}

export function buildDiff(original: LoanRecord, updated: Partial<LoanRecord>): string {
  const changedRows:   string[] = []
  const unchangedRows: string[] = []

  for (const { key, label } of DIFF_FIELDS) {
    const oldStr = fmtVal(key, original[key])
    const newStr = fmtVal(key, updated[key as keyof typeof updated])

    if (oldStr !== newStr) {
      changedRows.push(`
        <div class="diff-row diff-row--changed">
          <span class="diff-row__label">${label}</span>
          <div class="diff-row__values">
            <span class="diff-row__old">${oldStr}</span>
            <span class="diff-row__arrow">&#8594;</span>
            <span class="diff-row__new">${newStr}</span>
          </div>
        </div>`)
    } else {
      unchangedRows.push(`
        <div class="diff-row diff-row--unchanged">
          <span class="diff-row__label">${label}</span>
          <span class="diff-row__current">${oldStr}</span>
        </div>`)
    }
  }

  if (changedRows.length === 0) {
    return '<p class="diff-view__no-changes">No changes detected.</p>'
  }

  const n = changedRows.length
  return `
    <p class="diff-view__summary">${n} field${n !== 1 ? 's' : ''} changed</p>
    <div class="diff-section">
      <h3 class="diff-section__title">Changes</h3>
      ${changedRows.join('')}
    </div>
    ${unchangedRows.length > 0 ? `
    <div class="diff-section diff-section--muted">
      <h3 class="diff-section__title">Unchanged</h3>
      ${unchangedRows.join('')}
    </div>` : ''}`
}
