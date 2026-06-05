export type Params = Record<string, string>

export type RouteHandler = {
  render: (params: Params) => string
  mount:  (params: Params) => void
}

const routes: Array<{ pattern: RegExp; handler: RouteHandler }> = []

export function register(pattern: RegExp, handler: RouteHandler): void {
  routes.push({ pattern, handler })
}

export function navigate(path: string): void {
  window.location.hash = path
}

function dispatch(): void {
  const path = decodeURIComponent(window.location.hash.slice(1)) || '/'
  const appEl = document.getElementById('app')
  if (!appEl) return

  for (const { pattern, handler } of routes) {
    const match = path.match(pattern)
    if (match) {
      const params: Params = match.groups ?? {}
      appEl.innerHTML = handler.render(params)
      handler.mount(params)
      return
    }
  }
}

window.addEventListener('hashchange', dispatch)
document.addEventListener('DOMContentLoaded', dispatch)
