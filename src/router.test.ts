import { describe, it, expect, vi, beforeEach } from 'vitest'
import { register, navigate } from './router.ts'

describe('navigate', () => {
  it('sets window.location.hash', () => {
    navigate('/dashboard')
    expect(window.location.hash).toBe('#/dashboard')
  })

  it('sets hash for id-based paths', () => {
    navigate('/edit/5')
    expect(window.location.hash).toBe('#/edit/5')
  })
})

describe('register + dispatch', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>'
  })

  it('renders matched route into #app', () => {
    register(/^\/rt-render-test$/, {
      render: () => '<p>Rendered</p>',
      mount: () => {},
    })
    window.location.hash = '#/rt-render-test'
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    expect(document.getElementById('app')?.innerHTML).toBe('<p>Rendered</p>')
  })

  it('calls mount with matched params after render', () => {
    const mountFn = vi.fn()
    register(/^\/rt-mount-test$/, {
      render: () => '',
      mount: mountFn,
    })
    window.location.hash = '#/rt-mount-test'
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    expect(mountFn).toHaveBeenCalledOnce()
  })

  it('passes named capture groups to render and mount', () => {
    let capturedParams: Record<string, string> = {}
    register(/^\/rt-item\/(?<id>\d+)$/, {
      render: params => { capturedParams = params; return '' },
      mount: () => {},
    })
    window.location.hash = '#/rt-item/42'
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    expect(capturedParams['id']).toBe('42')
  })

  it('leaves #app unchanged for unmatched routes', () => {
    document.getElementById('app')!.innerHTML = '<p>existing</p>'
    window.location.hash = '#/rt-no-match-xyzabc'
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    expect(document.getElementById('app')?.innerHTML).toBe('<p>existing</p>')
  })

  it('does nothing when #app element is missing', () => {
    document.body.innerHTML = '' // no #app
    register(/^\/rt-no-app$/, { render: () => '<p>x</p>', mount: () => {} })
    window.location.hash = '#/rt-no-app'
    expect(() => window.dispatchEvent(new HashChangeEvent('hashchange'))).not.toThrow()
  })

  it('uses "/" as default path when hash is empty', () => {
    document.getElementById('app')!.innerHTML = '<p>existing</p>'
    window.location.hash = ''
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    // '/' matches no registered test route — content stays unchanged
    expect(document.getElementById('app')?.innerHTML).toBe('<p>existing</p>')
  })
})
