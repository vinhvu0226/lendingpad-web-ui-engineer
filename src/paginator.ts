export type PaginatorOptions = {
  totalRows:   number
  currentPage: number
  rowsPerPage: number
  onChange:    (page: number, rowsPerPage: number) => void
}

export type PaginatorController = {
  goToPage:    (page: number) => void
  updateTotal: (total: number) => void
}

export function initPaginator(opts: PaginatorOptions): PaginatorController {
  let page = opts.currentPage
  let rpp  = opts.rowsPerPage

  const footerInfo = document.querySelector<HTMLSpanElement>('#footer-info')
  const pageInfo   = document.querySelector<HTMLSpanElement>('#page-info')
  const prevBtn    = document.querySelector<HTMLButtonElement>('#prev-page')
  const nextBtn    = document.querySelector<HTMLButtonElement>('#next-page')
  const rppSelect  = document.querySelector<HTMLSelectElement>('#rows-per-page')

  function update(): void {
    const totalPages = Math.max(1, Math.ceil(opts.totalRows / rpp))
    page = Math.min(page, totalPages)
    const from = opts.totalRows === 0 ? 0 : (page - 1) * rpp + 1
    const to   = Math.min(page * rpp, opts.totalRows)
    if (footerInfo) footerInfo.textContent = `${from}–${to} of ${opts.totalRows}`
    if (pageInfo)   pageInfo.textContent   = `${page}/${totalPages}`
    if (prevBtn)    prevBtn.disabled       = page === 1
    if (nextBtn)    nextBtn.disabled       = page === totalPages
    opts.onChange(page, rpp)
  }

  if (rppSelect) {
    const select = rppSelect
    select.value = String(rpp) // restore persisted selection

    select.addEventListener('change', () => {
      rpp  = parseInt(select.value, 10)
      page = 1
      update()
    })

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        page--
        update()
      })
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        page++
        update()
      })
    }

    update() // initial render + display
  }

  return {
    goToPage(p: number) {
      page = p
      update()
    },
    updateTotal(total: number) {
      opts.totalRows = total
      page = 1
      update()
    },
  }
}
