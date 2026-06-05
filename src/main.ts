import './scss/main.scss'
import { register } from './router.ts'
import { render as dashboardRender, mount as dashboardMount, closeDropdowns, closeDrawer } from './views/dashboard.ts'

register(/^\/$/, { render: dashboardRender, mount: dashboardMount })

document.addEventListener('click', () => {
  closeDropdowns()
  closeDrawer()
})
