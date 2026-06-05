export function showToast(message: string, type: 'success' | 'error' = 'success'): void {
  document.querySelector('.toast')?.remove()
  const toast = document.createElement('div')
  toast.className = `toast toast--${type}`
  toast.setAttribute('role', 'status')
  toast.setAttribute('aria-live', 'polite')
  toast.textContent = message
  document.body.appendChild(toast)
  toast.getBoundingClientRect()
  toast.classList.add('toast--visible')
  setTimeout(() => {
    toast.classList.remove('toast--visible')
    setTimeout(() => toast.remove(), 300)
  }, 3500)
}
