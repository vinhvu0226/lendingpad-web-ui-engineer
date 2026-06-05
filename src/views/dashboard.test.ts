import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, mount, closeDropdowns, closeDrawer } from './dashboard.ts'
import * as api from '../api.ts'

vi.mock('../api.ts', () => ({
  getRecords: vi.fn(),
  getRecord: vi.fn(),
  updateRecord: vi.fn(),
}))

const mockRecords = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  accountId: `ACC-00${i + 1}`,
  description: 'Test loan',
  status: 'open' as const,
  rate: 5.0,
  balance: i === 2 ? -500 : 1000,
  deposit: 200,
  email: `user${i + 1}@example.com`,
  phone: '555-0001',
}))

const mockRecord = mockRecords[0]

async function setupDashboard(): Promise<void> {
  document.body.innerHTML = '<div id="app"></div>'
  document.getElementById('app')!.innerHTML = render()
  vi.mocked(api.getRecords).mockResolvedValue(mockRecords)
  await mount()
}

// ── render() ──────────────────────────────────────────────────────────────────

describe('render()', () => {
  it('returns HTML string containing the table structure', () => {
    const html = render()
    expect(html).toContain('class="data-table"')
    expect(html).toContain('class="data-table__body"')
  })

  it('includes all three sortable column data-sort-key attributes', () => {
    const html = render()
    expect(html).toContain('data-sort-key="id"')
    expect(html).toContain('data-sort-key="name"')
    expect(html).toContain('data-sort-key="status"')
  })

  it('includes paginator DOM hooks', () => {
    const html = render()
    expect(html).toContain('id="footer-info"')
    expect(html).toContain('id="rows-per-page"')
    expect(html).toContain('id="prev-page"')
    expect(html).toContain('id="next-page"')
  })

  it('includes sort icons in sortable headers', () => {
    const html = render()
    expect(html).toContain('class="sort-icons"')
    expect(html).toContain('icon-up-sort')
    expect(html).toContain('icon-down-sort')
  })

  it('includes drawer and backdrop elements', () => {
    const html = render()
    expect(html).toContain('id="edit-drawer"')
    expect(html).toContain('id="drawer-backdrop"')
    expect(html).toContain('id="drawer-form"')
  })
})

// ── mount() ───────────────────────────────────────────────────────────────────

describe('mount()', () => {
  beforeEach(setupDashboard)

  it('populates tbody with one row per record', () => {
    const rows = document.querySelectorAll('.data-table__body .data-table__row')
    expect(rows.length).toBe(mockRecords.length)
  })

  it('renders the first record name', () => {
    const names = document.querySelectorAll('.user-info__name')
    expect(names[0].textContent).toBe('User 1')
  })

  it('renders account id sub-label', () => {
    const ids = document.querySelectorAll('.user-info__id')
    expect(ids[0].textContent).toBe('ACC-001')
  })

  it('renders status badge with capitalized label', () => {
    const badges = document.querySelectorAll('.status-badge')
    expect(badges.length).toBe(mockRecords.length)
    expect(badges[0].textContent?.trim()).toBe('Open')
  })

  it('applies negative class to cells with negative balance', () => {
    const negativeCells = document.querySelectorAll('.data-table__cell--negative')
    expect(negativeCells.length).toBe(1)
  })

  it('renders action trigger button for each row', () => {
    const triggers = document.querySelectorAll('.action-trigger')
    expect(triggers.length).toBe(mockRecords.length)
  })

  it('renders edit button with data-edit-id for each row', () => {
    const editBtns = document.querySelectorAll<HTMLButtonElement>('.edit-btn[data-edit-id]')
    expect(editBtns.length).toBe(mockRecords.length)
    expect(editBtns[0].dataset['editId']).toBe('1')
  })

  it('shows error row when API throws', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    document.getElementById('app')!.innerHTML = render()
    vi.mocked(api.getRecords).mockRejectedValue(new Error('Network error'))
    await mount()
    const tbody = document.querySelector('.data-table__body')
    expect(tbody?.textContent).toContain('Could not load records')
  })
})

// ── sort ──────────────────────────────────────────────────────────────────────

describe('sort', () => {
  beforeEach(setupDashboard)

  it('default sort is by id ascending — id header has sorted class on load', () => {
    const idTh = document.querySelector<HTMLElement>('[data-sort-key="id"]')!
    expect(
      idTh.classList.contains('data-table__cell--sorted-asc') ||
      idTh.classList.contains('data-table__cell--sorted-desc')
    ).toBe(true)
  })

  it('clicking a different header adds a sorted class to it', () => {
    const nameTh = document.querySelector<HTMLElement>('[data-sort-key="name"]')!
    nameTh.click()
    expect(
      nameTh.classList.contains('data-table__cell--sorted-asc') ||
      nameTh.classList.contains('data-table__cell--sorted-desc')
    ).toBe(true)
  })

  it('clicking a different header removes sorted class from previous header', () => {
    const idTh = document.querySelector<HTMLElement>('[data-sort-key="id"]')!
    const nameTh = document.querySelector<HTMLElement>('[data-sort-key="name"]')!
    nameTh.click()
    expect(idTh.classList.contains('data-table__cell--sorted-asc')).toBe(false)
    expect(idTh.classList.contains('data-table__cell--sorted-desc')).toBe(false)
  })

  it('clicking the active header reverses sort direction', () => {
    const statusTh = document.querySelector<HTMLElement>('[data-sort-key="status"]')!
    statusTh.click()
    const firstClass = statusTh.classList.contains('data-table__cell--sorted-asc') ? 'asc' : 'desc'
    statusTh.click()
    const secondClass = statusTh.classList.contains('data-table__cell--sorted-asc') ? 'asc' : 'desc'
    expect(firstClass).not.toBe(secondClass)
  })
})

// ── dropdowns ─────────────────────────────────────────────────────────────────

describe('dropdowns', () => {
  beforeEach(setupDashboard)

  it('clicking action trigger opens its dropdown', () => {
    const trigger = document.querySelector<HTMLButtonElement>('.action-trigger')!
    trigger.click()
    const dropdown = trigger.closest('.data-table__cell--actions')
      ?.querySelector('.action-dropdown')
    expect(dropdown?.classList.contains('action-dropdown--open')).toBe(true)
  })

  it('only one dropdown is open at a time', () => {
    const triggers = document.querySelectorAll<HTMLButtonElement>('.action-trigger')
    triggers[0].click()
    triggers[1].click()
    expect(document.querySelectorAll('.action-dropdown--open').length).toBe(1)
  })

  it('clicking the same trigger again closes the dropdown', () => {
    const trigger = document.querySelector<HTMLButtonElement>('.action-trigger')!
    trigger.click()
    trigger.click()
    const dropdown = trigger.closest('.data-table__cell--actions')
      ?.querySelector('.action-dropdown')
    expect(dropdown?.classList.contains('action-dropdown--open')).toBe(false)
  })

  it('closeDropdowns removes --open class from all dropdowns', () => {
    const trigger = document.querySelector<HTMLButtonElement>('.action-trigger')!
    trigger.click()
    closeDropdowns()
    expect(document.querySelectorAll('.action-dropdown--open').length).toBe(0)
  })

  it('closeDropdowns clears inline positioning styles', () => {
    const trigger = document.querySelector<HTMLButtonElement>('.action-trigger')!
    trigger.click()
    const dropdown = trigger.closest('.data-table__cell--actions')
      ?.querySelector<HTMLDivElement>('.action-dropdown')!
    closeDropdowns()
    expect(dropdown.style.cssText).toBe('')
  })
})

// ── drawer ────────────────────────────────────────────────────────────────────

describe('drawer', () => {
  beforeEach(async () => {
    await setupDashboard()
    vi.mocked(api.getRecord).mockResolvedValue(mockRecord)
  })

  it('clicking edit button opens the drawer', async () => {
    const editBtn = document.querySelector<HTMLButtonElement>('.edit-btn[data-edit-id]')!
    editBtn.click()
    await Promise.resolve()
    expect(document.getElementById('edit-drawer')?.classList.contains('drawer--open')).toBe(true)
    expect(document.getElementById('drawer-backdrop')?.classList.contains('drawer-backdrop--open')).toBe(true)
  })

  it('drawer is populated with record data after open', async () => {
    const editBtn = document.querySelector<HTMLButtonElement>('.edit-btn[data-edit-id]')!
    editBtn.click()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect((document.getElementById('drawer-full-name') as HTMLInputElement).value).toBe('User 1')
    expect((document.getElementById('drawer-email') as HTMLInputElement).value).toBe('user1@example.com')
    expect((document.getElementById('drawer-account-id') as HTMLInputElement).value).toBe('ACC-001')
  })

  it('close button removes drawer--open class', async () => {
    const editBtn = document.querySelector<HTMLButtonElement>('.edit-btn[data-edit-id]')!
    editBtn.click()
    await new Promise(resolve => setTimeout(resolve, 0))
    document.getElementById('drawer-close')!.click()
    expect(document.getElementById('edit-drawer')?.classList.contains('drawer--open')).toBe(false)
  })

  it('backdrop click closes the drawer', async () => {
    const editBtn = document.querySelector<HTMLButtonElement>('.edit-btn[data-edit-id]')!
    editBtn.click()
    await new Promise(resolve => setTimeout(resolve, 0))
    document.getElementById('drawer-backdrop')!.click()
    expect(document.getElementById('edit-drawer')?.classList.contains('drawer--open')).toBe(false)
  })

  it('cancel button closes the drawer', async () => {
    const editBtn = document.querySelector<HTMLButtonElement>('.edit-btn[data-edit-id]')!
    editBtn.click()
    await new Promise(resolve => setTimeout(resolve, 0))
    document.getElementById('drawer-cancel')!.click()
    expect(document.getElementById('edit-drawer')?.classList.contains('drawer--open')).toBe(false)
  })

  it('Escape key closes the drawer', async () => {
    const editBtn = document.querySelector<HTMLButtonElement>('.edit-btn[data-edit-id]')!
    editBtn.click()
    await new Promise(resolve => setTimeout(resolve, 0))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(document.getElementById('edit-drawer')?.classList.contains('drawer--open')).toBe(false)
  })

  it('closeDrawer removes body--drawer-open class', async () => {
    const editBtn = document.querySelector<HTMLButtonElement>('.edit-btn[data-edit-id]')!
    editBtn.click()
    await new Promise(resolve => setTimeout(resolve, 0))
    closeDrawer()
    expect(document.body.classList.contains('body--drawer-open')).toBe(false)
  })


  it('saving updates cached record and closes drawer', async () => {
    const updatedRecord = { ...mockRecord, name: 'Updated Name' }
    vi.mocked(api.updateRecord).mockResolvedValue(updatedRecord)

    const editBtn = document.querySelector<HTMLButtonElement>('.edit-btn[data-edit-id]')!
    editBtn.click()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Step 1: confirm (validates form, builds diff, slides to panel 2)
    document.getElementById('drawer-confirm')!.click()
    await Promise.resolve()

    // Step 2: save (calls API, closes drawer)
    document.getElementById('drawer-save')!.click()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(api.updateRecord).toHaveBeenCalled()
    expect(document.getElementById('edit-drawer')?.classList.contains('drawer--open')).toBe(false)
  })

  it('closes drawer and shows toast when getRecord fails', async () => {
    vi.mocked(api.getRecord).mockRejectedValue(new Error('Not found'))
    const editBtn = document.querySelector<HTMLButtonElement>('.edit-btn[data-edit-id]')!
    editBtn.click()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(document.getElementById('edit-drawer')?.classList.contains('drawer--open')).toBe(false)
  })

  it('shows validation error when required fields are empty', async () => {
    const editBtn = document.querySelector<HTMLButtonElement>('.edit-btn[data-edit-id]')!
    editBtn.click()
    await new Promise(resolve => setTimeout(resolve, 0))

    ;(document.getElementById('drawer-full-name') as HTMLInputElement).value = ''
    document.getElementById('drawer-confirm')!.click()
    await Promise.resolve()

    expect(
      (document.getElementById('drawer-full-name') as HTMLInputElement)
        .classList.contains('form-field__input--error')
    ).toBe(true)
    expect(document.getElementById('edit-drawer')?.classList.contains('drawer--open')).toBe(true)
  })

  it('confirm button slides to confirm panel when form is valid', async () => {
    const editBtn = document.querySelector<HTMLButtonElement>('.edit-btn[data-edit-id]')!
    editBtn.click()
    await new Promise(resolve => setTimeout(resolve, 0))

    document.getElementById('drawer-confirm')!.click()

    expect(
      document.getElementById('drawer-panels-track')?.classList.contains('drawer__panels-track--step-2')
    ).toBe(true)
  })

  it('back button returns to edit panel', async () => {
    const editBtn = document.querySelector<HTMLButtonElement>('.edit-btn[data-edit-id]')!
    editBtn.click()
    await new Promise(resolve => setTimeout(resolve, 0))

    document.getElementById('drawer-confirm')!.click()
    document.getElementById('drawer-back')!.click()

    expect(
      document.getElementById('drawer-panels-track')?.classList.contains('drawer__panels-track--step-2')
    ).toBe(false)
  })

  it('diff panel shows old and new values when a field is changed', async () => {
    const editBtn = document.querySelector<HTMLButtonElement>('.edit-btn[data-edit-id]')!
    editBtn.click()
    await new Promise(resolve => setTimeout(resolve, 0))

    ;(document.getElementById('drawer-full-name') as HTMLInputElement).value = 'Changed Name'
    document.getElementById('drawer-confirm')!.click()

    const diff = document.getElementById('drawer-diff')!
    expect(diff.textContent).toContain('User 1')        // old value
    expect(diff.textContent).toContain('Changed Name')  // new value
    expect(diff.querySelector('.diff-row--changed')).not.toBeNull()
  })

  it('toast auto-removes after 3.5s + 300ms', async () => {
    await setupDashboard()
    vi.mocked(api.getRecord).mockResolvedValue(mockRecord)
    vi.useFakeTimers()
    try {
      const editBtn = document.querySelector<HTMLButtonElement>('.edit-btn[data-edit-id]')!
      editBtn.click()
      await Promise.resolve()
      await Promise.resolve()

      ;(document.getElementById('drawer-full-name') as HTMLInputElement).value = ''
      document.getElementById('drawer-confirm')!.click()
      await Promise.resolve()

      expect(document.querySelector('.toast')).not.toBeNull()

      vi.advanceTimersByTime(3500)
      expect(document.querySelector('.toast--visible')).toBeNull()

      vi.advanceTimersByTime(300)
      expect(document.querySelector('.toast')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })
})

// ── search ────────────────────────────────────────────────────────────────────

describe('search', () => {
  beforeEach(setupDashboard)

  function type(value: string): void {
    const input = document.querySelector<HTMLInputElement>('.search-box__input')!
    input.value = value
    input.dispatchEvent(new Event('input'))
  }

  it('filters rows by name', () => {
    type('User 1')
    expect(document.querySelectorAll('.data-table__body .data-table__row').length).toBe(1)
  })

  it('search is case-insensitive', () => {
    type('user')
    expect(document.querySelectorAll('.data-table__body .data-table__row').length).toBe(5)
  })

  it('clearing the query restores all rows', () => {
    type('User 1')
    type('')
    expect(document.querySelectorAll('.data-table__body .data-table__row').length).toBe(5)
  })

  it('no match shows empty state message containing the query', () => {
    type('xyznonexistent')
    expect(document.querySelector('.data-table__body')?.textContent).toContain('No records match')
    expect(document.querySelector('.data-table__body')?.textContent).toContain('xyznonexistent')
  })

  it('matches on email field', () => {
    type('user3@example.com')
    expect(document.querySelectorAll('.data-table__body .data-table__row').length).toBe(1)
  })
})

// ── drawer loading state ───────────────────────────────────────────────────────

describe('drawer loading state', () => {
  beforeEach(async () => {
    await setupDashboard()
    vi.mocked(api.getRecord).mockResolvedValue(mockRecord)
  })

  it('skeleton is visible and form is hidden synchronously after edit click', () => {
    const editBtn = document.querySelector<HTMLButtonElement>('.edit-btn[data-edit-id]')!
    editBtn.click()
    expect(document.getElementById('drawer-skeleton')?.hidden).toBe(false)
    expect(document.getElementById('drawer-form')?.hidden).toBe(true)
  })

  it('confirm button is disabled while loading', () => {
    const editBtn = document.querySelector<HTMLButtonElement>('.edit-btn[data-edit-id]')!
    editBtn.click()
    expect((document.getElementById('drawer-confirm') as HTMLButtonElement).disabled).toBe(true)
  })

  it('skeleton is hidden and form is visible after record loads', async () => {
    const editBtn = document.querySelector<HTMLButtonElement>('.edit-btn[data-edit-id]')!
    editBtn.click()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(document.getElementById('drawer-skeleton')?.hidden).toBe(true)
    expect(document.getElementById('drawer-form')?.hidden).toBe(false)
  })

  it('confirm button is enabled after record loads', async () => {
    const editBtn = document.querySelector<HTMLButtonElement>('.edit-btn[data-edit-id]')!
    editBtn.click()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect((document.getElementById('drawer-confirm') as HTMLButtonElement).disabled).toBe(false)
  })
})

// ── master checkbox ────────────────────────────────────────────────────────────

describe('master checkbox', () => {
  beforeEach(setupDashboard)

  it('checking master selects all row checkboxes', () => {
    const master = document.querySelector<HTMLInputElement>('.checkbox--master')!
    master.checked = true
    master.dispatchEvent(new Event('change'))
    document.querySelectorAll<HTMLInputElement>('.data-table__body .checkbox')
      .forEach(cb => expect(cb.checked).toBe(true))
  })

  it('unchecking master deselects all row checkboxes', () => {
    const master = document.querySelector<HTMLInputElement>('.checkbox--master')!
    master.checked = true
    master.dispatchEvent(new Event('change'))
    master.checked = false
    master.dispatchEvent(new Event('change'))
    document.querySelectorAll<HTMLInputElement>('.data-table__body .checkbox')
      .forEach(cb => expect(cb.checked).toBe(false))
  })
})
