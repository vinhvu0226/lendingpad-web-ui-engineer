import { getRecords, getRecord, updateRecord } from '../api.ts'
import type { LoanRecord } from '../api.ts'
import { initPaginator } from '../paginator.ts'
import type { PaginatorController } from '../paginator.ts'
import { sortBy } from '../utils/sort.ts'
import type { SortDir } from '../utils/sort.ts'
import { showToast } from '../utils/toast.ts'
import { buildDiff } from '../utils/diff.ts'
import { rowTemplate } from '../components/row.ts'
import { drawerTemplate } from '../components/drawer.ts'

// ── Module state ──────────────────────────────────────────────────────────────
let sortKey:               keyof LoanRecord | null = 'id'
let sortDir:               SortDir = 'asc'
let cachedRecords:         LoanRecord[] = []
let searchQuery:           string = ''
let currentPage:           number = 1
let rowsPerPage:           number = 10
let paginatorCtrl:         PaginatorController | null = null
let currentDrawerRecordId: number | null = null
let currentDrawerRecord:   LoanRecord | null = null
let pendingUpdate:         Partial<LoanRecord> | null = null

// ── View shell ────────────────────────────────────────────────────────────────

export function render(): string {
  return `
    <div class="dashboard">
      <div class="dashboard__content-card">
        <header class="dashboard__toolbar">
          <div class="dashboard__toolbar-left">
            <button class="btn btn--icon" aria-label="Filter">
              <i class="icon-filter" aria-hidden="true"></i>
            </button>
            <div class="search-box">
              <i class="icon-search" aria-hidden="true"></i>
              <input type="text" class="search-box__input" placeholder="Search...">
            </div>
          </div>
          <div class="dashboard__toolbar-right">
            <button class="btn btn--primary">
              <i class="icon-add" aria-hidden="true"></i>
              Add User
            </button>
          </div>
        </header>
        <div class="dashboard__table-scroll">
          <table class="data-table">
            <thead class="data-table__header">
              <tr class="data-table__row">
                <th class="data-table__cell"><input type="checkbox" class="checkbox checkbox--master"></th>
                <th class="data-table__cell data-table__cell--header data-table__cell--sortable data-table__cell--num" data-sort-key="id">
                  # <span class="sort-icons"><i class="icon-down-sort" aria-hidden="true"></i><i class="icon-up-sort" aria-hidden="true"></i></span>
                </th>
                <th class="data-table__cell data-table__cell--header data-table__cell--edit"></th>
                <th class="data-table__cell data-table__cell--header data-table__cell--sortable data-table__cell--name" data-sort-key="name">
                  Name <span class="sort-icons"><i class="icon-down-sort" aria-hidden="true"></i><i class="icon-up-sort" aria-hidden="true"></i></span>
                </th>
                <th class="data-table__cell data-table__cell--header data-table__cell--description">Description</th>
                <th class="data-table__cell data-table__cell--header data-table__cell--sortable data-table__cell--status" data-sort-key="status">
                  Status <span class="sort-icons"><i class="icon-down-sort" aria-hidden="true"></i><i class="icon-up-sort" aria-hidden="true"></i></span>
                </th>
                <th class="data-table__cell data-table__cell--header">Rate</th>
                <th class="data-table__cell data-table__cell--header">Balance</th>
                <th class="data-table__cell data-table__cell--header">Deposit</th>
                <th class="data-table__cell data-table__cell--header"></th>
              </tr>
            </thead>
            <tbody class="data-table__body"></tbody>
          </table>
        </div>

        <div class="table-footer">
          <span class="table-footer__info" id="footer-info">Loading…</span>
          <div class="table-footer__controls">
            <label class="rows-per-page">
              <span class="rows-per-page__label">Rows per page:</span>
              <div class="rows-per-page__select-wrap">
                <select class="rows-per-page__select" id="rows-per-page" aria-label="Rows per page">
                  <option value="10" selected>10</option>
                  <option value="20">20</option>
                  <option value="40">40</option>
                  <option value="50">50</option>
                </select>
              </div>
            </label>
            <nav class="paginator" aria-label="Table pagination">
              <button class="paginator__btn" id="prev-page" aria-label="Previous page" disabled>&#8249;</button>
              <span class="paginator__page-info" id="page-info">1/1</span>
              <button class="paginator__btn" id="next-page" aria-label="Next page">&#8250;</button>
            </nav>
          </div>
        </div>
      </div>
    </div>

    ${drawerTemplate()}`
}

// ── Mount ─────────────────────────────────────────────────────────────────────

export async function mount(): Promise<void> {
  const tbody = document.querySelector<HTMLTableSectionElement>('.data-table__body')
  if (!tbody) return

  searchQuery = ''

  try {
    cachedRecords = await getRecords()
    setupMasterCheckbox()
    setupSort()
    setupDrawer()
    setupSearch()
    paginatorCtrl = initPaginator({
      totalRows:   cachedRecords.length,
      currentPage,
      rowsPerPage,
      onChange: (page, rpp) => {
        currentPage = page
        rowsPerPage = rpp
        renderPage()
      },
    })
  } catch {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align:center;padding:2rem;color:#687182">
          Could not load records — make sure the API is running (<code>yarn api</code>).
        </td>
      </tr>`
  }
}

// ── Render page ───────────────────────────────────────────────────────────────

function getFilteredRecords(): LoanRecord[] {
  if (!searchQuery) return cachedRecords
  const q = searchQuery.toLowerCase()
  return cachedRecords.filter(r =>
    r.name.toLowerCase().includes(q)        ||
    r.accountId.toLowerCase().includes(q)   ||
    r.description.toLowerCase().includes(q) ||
    r.status.toLowerCase().includes(q)
  )
}

function renderPage(): void {
  const tbody = document.querySelector<HTMLTableSectionElement>('.data-table__body')
  if (!tbody) return

  const filtered = getFilteredRecords()

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="data-table__empty">
          ${searchQuery ? `No records match "${searchQuery}".` : 'No records found.'}
        </td>
      </tr>`
    return
  }

  const base  = sortKey ? sortBy(filtered, sortKey, sortDir) : filtered
  const start = (currentPage - 1) * rowsPerPage
  const slice = base.slice(start, start + rowsPerPage)
  tbody.innerHTML = slice.map((r, i) => rowTemplate(r, start + i)).join('')
  setupDropdowns()
  setupEditButtons()
}

// ── Sort ──────────────────────────────────────────────────────────────────────

function setupSort(): void {
  document.querySelectorAll<HTMLTableCellElement>('[data-sort-key]').forEach(th => {
    if (sortKey !== null && th.dataset['sortKey'] === String(sortKey)) {
      th.classList.add(`data-table__cell--sorted-${sortDir}`)
    }
    th.addEventListener('click', () => {
      const key = th.dataset['sortKey'] as keyof LoanRecord
      sortDir = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc'
      sortKey = key
      applySort()
    })
  })
}

function applySort(): void {
  document.querySelectorAll<HTMLTableCellElement>('[data-sort-key]').forEach(th => {
    th.classList.remove('data-table__cell--sorted-asc', 'data-table__cell--sorted-desc')
    if (sortKey !== null && th.dataset['sortKey'] === String(sortKey)) {
      th.classList.add(`data-table__cell--sorted-${sortDir}`)
    }
  })
  paginatorCtrl?.goToPage(1)
}

// ── Dropdowns ─────────────────────────────────────────────────────────────────

function setupDropdowns(): void {
  document.querySelectorAll<HTMLButtonElement>('.action-trigger').forEach(trigger => {
    trigger.addEventListener('click', e => {
      e.stopPropagation()
      const cell     = trigger.closest<HTMLTableCellElement>('.data-table__cell--actions')!
      const dropdown = cell.querySelector<HTMLDivElement>('.action-dropdown')!
      const isOpen   = dropdown.classList.contains('action-dropdown--open')
      closeDropdowns()
      if (!isOpen) {
        positionDropdown(trigger, dropdown)
        dropdown.classList.add('action-dropdown--open')
      }
    })
  })
}

function positionDropdown(trigger: HTMLButtonElement, dropdown: HTMLDivElement): void {
  const rect            = trigger.getBoundingClientRect()
  const estimatedHeight = 130

  dropdown.style.position = 'fixed'
  dropdown.style.left     = 'auto'
  dropdown.style.right    = `${window.innerWidth - rect.right}px`

  if (window.innerHeight - rect.bottom < estimatedHeight) {
    dropdown.style.top    = 'auto'
    dropdown.style.bottom = `${window.innerHeight - rect.top + 4}px`
  } else {
    dropdown.style.top    = `${rect.bottom + 4}px`
    dropdown.style.bottom = 'auto'
  }
}

export function closeDropdowns(): void {
  document.querySelectorAll<HTMLDivElement>('.action-dropdown--open').forEach(d => {
    d.classList.remove('action-dropdown--open')
    d.style.cssText = ''
  })
}

// ── Edit buttons ──────────────────────────────────────────────────────────────

function setupEditButtons(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-edit-id]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation()
      closeDropdowns()
      const id = parseInt(btn.dataset['editId'] ?? '0', 10)
      if (id) openDrawer(id)
    })
  })
}

// ── Drawer ────────────────────────────────────────────────────────────────────

function setupDrawer(): void {
  document.getElementById('edit-drawer')?.addEventListener('click', e => e.stopPropagation())

  document.getElementById('drawer-close')?.addEventListener('click', closeDrawer)
  document.getElementById('drawer-close-2')?.addEventListener('click', closeDrawer)
  document.getElementById('drawer-cancel')?.addEventListener('click', closeDrawer)
  document.getElementById('drawer-backdrop')?.addEventListener('click', closeDrawer)

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.getElementById('edit-drawer')?.classList.contains('drawer--open')) {
      closeDrawer()
    }
  })

  document.getElementById('drawer-back')?.addEventListener('click', () => showPanel(1))

  document.getElementById('drawer-confirm')?.addEventListener('click', () => {
    const form = document.querySelector<HTMLFormElement>('#drawer-form')
    if (!form || !currentDrawerRecord) return
    if (!validateDrawer(form)) {
      showToast('Please fill in all required fields.', 'error')
      return
    }
    pendingUpdate = collectDrawer()
    const diffEl = document.getElementById('drawer-diff')
    if (diffEl) diffEl.innerHTML = buildDiff(currentDrawerRecord, pendingUpdate)
    showPanel(2)
  })

  document.getElementById('drawer-save')?.addEventListener('click', async () => {
    if (!currentDrawerRecordId || !pendingUpdate) return
    const saveBtn = document.getElementById('drawer-save') as HTMLButtonElement | null
    if (saveBtn) saveBtn.disabled = true

    try {
      await updateRecord(currentDrawerRecordId, pendingUpdate)
      cachedRecords = await getRecords()
      renderPage()
      closeDrawer()
      showToast('Record saved successfully.')
    } catch {
      showToast('Failed to save. Please try again.', 'error')
    } finally {
      if (saveBtn) saveBtn.disabled = false
    }
  })
}

function showPanel(n: 1 | 2): void {
  document.getElementById('drawer-panels-track')
    ?.classList.toggle('drawer__panels-track--step-2', n === 2)
}

async function openDrawer(id: number): Promise<void> {
  currentDrawerRecordId = id
  currentDrawerRecord   = null
  pendingUpdate         = null
  clearDrawer()
  showPanel(1)

  document.getElementById('edit-drawer')?.classList.add('drawer--open')
  document.getElementById('drawer-backdrop')?.classList.add('drawer-backdrop--open')
  document.body.classList.add('body--drawer-open')

  setDrawerLoading(true)

  try {
    const record = await getRecord(id)
    populateDrawer(record)
  } catch {
    showToast('Could not load record.', 'error')
    closeDrawer()
  }
}

export function closeDrawer(): void {
  document.getElementById('edit-drawer')?.classList.remove('drawer--open')
  document.getElementById('drawer-backdrop')?.classList.remove('drawer-backdrop--open')
  document.body.classList.remove('body--drawer-open')
  showPanel(1)
  currentDrawerRecordId = null
  currentDrawerRecord   = null
  pendingUpdate         = null
}

function clearDrawer(): void {
  const fields = ['drawer-full-name', 'drawer-account-id', 'drawer-description',
                  'drawer-rate', 'drawer-balance', 'drawer-deposit']
  fields.forEach(id => {
    const el = document.getElementById(id) as HTMLInputElement | null
    if (el) { el.value = ''; el.classList.remove('form-field__input--error') }
  })
  const status = document.getElementById('drawer-status') as HTMLSelectElement | null
  if (status) status.value = 'open'
}

function populateDrawer(record: LoanRecord): void {
  currentDrawerRecord = record
  const set = (id: string, value: string) => {
    const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null
    if (el) el.value = value
  }
  set('drawer-full-name',  record.name)
  set('drawer-account-id', record.accountId)
  set('drawer-description', record.description)
  set('drawer-rate',       String(record.rate))
  set('drawer-balance',    String(record.balance))
  set('drawer-deposit',    String(record.deposit))
  set('drawer-status',     record.status)
  setDrawerLoading(false)
  document.getElementById('drawer-full-name')?.focus()
}

function collectDrawer(): Partial<LoanRecord> {
  const val = (id: string) =>
    (document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null)
      ?.value.trim() ?? ''
  return {
    name:        val('drawer-full-name'),
    accountId:   val('drawer-account-id'),
    description: val('drawer-description'),
    rate:        parseFloat(val('drawer-rate')),
    balance:     parseFloat(val('drawer-balance')),
    deposit:     parseFloat(val('drawer-deposit')),
    status:      val('drawer-status') as LoanRecord['status'],
  }
}

function validateDrawer(form: HTMLFormElement): boolean {
  let ok = true
  form.querySelectorAll<HTMLInputElement>('[required]').forEach(field => {
    const invalid = !field.value.trim()
    field.classList.toggle('form-field__input--error', invalid)
    if (invalid) ok = false
  })
  return ok
}

// ── Search ────────────────────────────────────────────────────────────────────

function setupSearch(): void {
  document.querySelector<HTMLInputElement>('.search-box__input')
    ?.addEventListener('input', e => {
      searchQuery = (e.target as HTMLInputElement).value.trim()
      paginatorCtrl?.updateTotal(getFilteredRecords().length)
    })
}

// ── Drawer loading ────────────────────────────────────────────────────────────

function setDrawerLoading(loading: boolean): void {
  const skeleton   = document.getElementById('drawer-skeleton')
  const form       = document.getElementById('drawer-form')
  const confirmBtn = document.getElementById('drawer-confirm') as HTMLButtonElement | null
  if (skeleton)   skeleton.hidden   = !loading
  if (form)       form.hidden       = loading
  if (confirmBtn) confirmBtn.disabled = loading
}

// ── Master checkbox ───────────────────────────────────────────────────────────

function setupMasterCheckbox(): void {
  const master = document.querySelector<HTMLInputElement>('.checkbox--master')
  if (!master) return
  master.addEventListener('change', () => {
    document.querySelectorAll<HTMLInputElement>('.data-table__body .checkbox')
      .forEach(cb => { cb.checked = master.checked })
  })
}
