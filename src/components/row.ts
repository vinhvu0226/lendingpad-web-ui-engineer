import type { LoanRecord } from '../api.ts'
import { fmt, cap } from '../utils/format.ts'

export function rowTemplate(record: LoanRecord, _index: number): string {
  const negClass = record.balance < 0 ? ' data-table__cell--negative' : ''
  return `
    <tr class="data-table__row" data-id="${record.id}">
      <td class="data-table__cell"><input type="checkbox" class="checkbox"></td>
      <td class="data-table__cell data-table__cell--num">${record.id}</td>
      <td class="data-table__cell data-table__cell--edit">
        <button class="edit-btn" aria-label="Edit record" data-edit-id="${record.id}">
          <i class="icon-pencil" aria-hidden="true"></i>
        </button>
      </td>
      <td class="data-table__cell data-table__cell--name">
        <div class="user-info">
          <span class="user-info__name">${record.name}</span>
          <span class="user-info__id">${record.accountId}</span>
        </div>
      </td>
      <td class="data-table__cell data-table__cell--description">${record.description}</td>
      <td class="data-table__cell data-table__cell--status">
        <span class="status-badge status-badge--${record.status}">${cap(record.status)}</span>
      </td>
      <td class="data-table__cell data-table__cell--currency">
        ${fmt(record.rate)} <span class="currency-label">CAD</span>
      </td>
      <td class="data-table__cell data-table__cell--currency${negClass}">
        ${fmt(record.balance)} <span class="currency-label">CAD</span>
      </td>
      <td class="data-table__cell data-table__cell--currency">
        ${fmt(record.deposit)} <span class="currency-label">CAD</span>
      </td>
      <td class="data-table__cell data-table__cell--actions">
        <button class="action-trigger" aria-label="Open Actions Menu">
          <i class="icon-actions" aria-hidden="true"></i>
        </button>
        <div class="action-dropdown">
          <button class="action-dropdown__item action-dropdown__item--invite">
            Invite Consumer <i class="icon-invite" aria-hidden="true"></i>
          </button>
          <button class="action-dropdown__item action-dropdown__item--email">
            Send Email <i class="icon-email" aria-hidden="true"></i>
          </button>
          <button class="action-dropdown__item action-dropdown__item--cost">
            Manage Cost Details <i class="icon-cost" aria-hidden="true"></i>
          </button>
        </div>
      </td>
    </tr>`
}
