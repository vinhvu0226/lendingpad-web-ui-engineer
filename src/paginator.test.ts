import { describe, it, expect, vi, beforeEach } from 'vitest'
import { initPaginator } from './paginator.ts'

function setupDOM(): void {
  document.body.innerHTML = `
    <span id="footer-info"></span>
    <span id="page-info"></span>
    <button id="prev-page"></button>
    <button id="next-page"></button>
    <select id="rows-per-page">
      <option value="10" selected>10</option>
      <option value="20">20</option>
      <option value="50">50</option>
    </select>
  `
}

describe('initPaginator', () => {
  beforeEach(setupDOM)

  it('displays correct footer info on init', () => {
    initPaginator({ totalRows: 25, currentPage: 1, rowsPerPage: 10, onChange: vi.fn() })
    expect(document.getElementById('footer-info')?.textContent).toBe('1–10 of 25')
  })

  it('displays correct page info on init', () => {
    initPaginator({ totalRows: 25, currentPage: 1, rowsPerPage: 10, onChange: vi.fn() })
    expect(document.getElementById('page-info')?.textContent).toBe('1/3')
  })

  it('disables prev button on first page', () => {
    initPaginator({ totalRows: 25, currentPage: 1, rowsPerPage: 10, onChange: vi.fn() })
    expect((document.getElementById('prev-page') as HTMLButtonElement).disabled).toBe(true)
  })

  it('enables next button when not on last page', () => {
    initPaginator({ totalRows: 25, currentPage: 1, rowsPerPage: 10, onChange: vi.fn() })
    expect((document.getElementById('next-page') as HTMLButtonElement).disabled).toBe(false)
  })

  it('disables next button on last page', () => {
    const ctrl = initPaginator({ totalRows: 25, currentPage: 1, rowsPerPage: 10, onChange: vi.fn() })
    ctrl.goToPage(3)
    expect((document.getElementById('next-page') as HTMLButtonElement).disabled).toBe(true)
  })

  it('enables prev button when not on first page', () => {
    const ctrl = initPaginator({ totalRows: 25, currentPage: 1, rowsPerPage: 10, onChange: vi.fn() })
    ctrl.goToPage(2)
    expect((document.getElementById('prev-page') as HTMLButtonElement).disabled).toBe(false)
  })

  it('calls onChange with initial page and rowsPerPage', () => {
    const onChange = vi.fn()
    initPaginator({ totalRows: 25, currentPage: 1, rowsPerPage: 10, onChange })
    expect(onChange).toHaveBeenCalledWith(1, 10)
  })

  it('navigates forward on next button click', () => {
    const onChange = vi.fn()
    initPaginator({ totalRows: 25, currentPage: 1, rowsPerPage: 10, onChange })
    ;(document.getElementById('next-page') as HTMLButtonElement).click()
    expect(document.getElementById('page-info')?.textContent).toBe('2/3')
    expect(onChange).toHaveBeenLastCalledWith(2, 10)
  })

  it('navigates backward on prev button click', () => {
    const onChange = vi.fn()
    initPaginator({ totalRows: 25, currentPage: 3, rowsPerPage: 10, onChange })
    ;(document.getElementById('prev-page') as HTMLButtonElement).click()
    expect(document.getElementById('page-info')?.textContent).toBe('2/3')
    expect(onChange).toHaveBeenLastCalledWith(2, 10)
  })

  it('goToPage jumps to the specified page', () => {
    const onChange = vi.fn()
    const ctrl = initPaginator({ totalRows: 25, currentPage: 1, rowsPerPage: 10, onChange })
    ctrl.goToPage(2)
    expect(document.getElementById('footer-info')?.textContent).toBe('11–20 of 25')
    expect(onChange).toHaveBeenLastCalledWith(2, 10)
  })

  it('goToPage clamps to last page when out of range', () => {
    const ctrl = initPaginator({ totalRows: 10, currentPage: 1, rowsPerPage: 10, onChange: vi.fn() })
    ctrl.goToPage(99)
    expect(document.getElementById('page-info')?.textContent).toBe('1/1')
  })

  it('changing rows-per-page resets to page 1', () => {
    const onChange = vi.fn()
    initPaginator({ totalRows: 25, currentPage: 2, rowsPerPage: 10, onChange })
    const select = document.getElementById('rows-per-page') as HTMLSelectElement
    select.value = '20'
    select.dispatchEvent(new Event('change'))
    expect(document.getElementById('page-info')?.textContent).toBe('1/2')
    expect(onChange).toHaveBeenLastCalledWith(1, 20)
  })

  it('handles 0 total rows', () => {
    initPaginator({ totalRows: 0, currentPage: 1, rowsPerPage: 10, onChange: vi.fn() })
    expect(document.getElementById('footer-info')?.textContent).toBe('0–0 of 0')
    expect(document.getElementById('page-info')?.textContent).toBe('1/1')
  })

  it('restores persisted rowsPerPage selection in the select element', () => {
    initPaginator({ totalRows: 50, currentPage: 1, rowsPerPage: 20, onChange: vi.fn() })
    const select = document.getElementById('rows-per-page') as HTMLSelectElement
    expect(select.value).toBe('20')
  })

  it('shows last-page range correctly', () => {
    initPaginator({ totalRows: 25, currentPage: 1, rowsPerPage: 10, onChange: vi.fn() })
    const ctrl = initPaginator({ totalRows: 25, currentPage: 1, rowsPerPage: 10, onChange: vi.fn() })
    ctrl.goToPage(3)
    expect(document.getElementById('footer-info')?.textContent).toBe('21–25 of 25')
  })

  it('does not call onChange when rows-per-page select is absent', () => {
    document.body.innerHTML = '' // no DOM at all
    const onChange = vi.fn()
    initPaginator({ totalRows: 10, currentPage: 1, rowsPerPage: 10, onChange })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('updateTotal resets to page 1 and recalculates display', () => {
    const onChange = vi.fn()
    const ctrl = initPaginator({ totalRows: 30, currentPage: 1, rowsPerPage: 10, onChange })
    ctrl.updateTotal(15)
    expect(document.getElementById('footer-info')?.textContent).toBe('1–10 of 15')
    expect(document.getElementById('page-info')?.textContent).toBe('1/2')
    expect(onChange).toHaveBeenLastCalledWith(1, 10)
  })

  it('does not throw when display elements are absent but select exists', () => {
    // Only the select — no footer-info, page-info, prev-page, next-page
    document.body.innerHTML = `
      <select id="rows-per-page"><option value="10" selected>10</option></select>
    `
    const onChange = vi.fn()
    expect(() => initPaginator({ totalRows: 10, currentPage: 1, rowsPerPage: 10, onChange })).not.toThrow()
    expect(onChange).toHaveBeenCalledWith(1, 10)
  })
})
