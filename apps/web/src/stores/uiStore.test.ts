import { describe, it, expect, beforeEach } from 'vitest'
import { useUiStore } from './uiStore'

describe('useUiStore', () => {
  beforeEach(() => {
    useUiStore.setState({
      isLoading: false,
      error: null,
      activeTab: 'diagram',
      toasts: [],
    })
  })

  it('sets loading state', () => {
    const { setLoading } = useUiStore.getState()
    setLoading(true)
    expect(useUiStore.getState().isLoading).toBe(true)
  })

  it('sets error', () => {
    const { setError } = useUiStore.getState()
    setError('Test error')
    expect(useUiStore.getState().error).toBe('Test error')
  })

  it('clears error', () => {
    const { setError, clearError } = useUiStore.getState()
    setError('Test error')
    clearError()
    expect(useUiStore.getState().error).toBeNull()
  })

  it('sets active tab', () => {
    const { setActiveTab } = useUiStore.getState()
    setActiveTab('drift')
    expect(useUiStore.getState().activeTab).toBe('drift')
  })

  it('adds toast', () => {
    const { addToast } = useUiStore.getState()
    addToast('Test message', 'success')

    const toasts = useUiStore.getState().toasts
    expect(toasts).toHaveLength(1)
    expect(toasts[0].message).toBe('Test message')
    expect(toasts[0].type).toBe('success')
    expect(toasts[0].id).toBeDefined()
  })

  it('removes toast', () => {
    const { addToast, removeToast } = useUiStore.getState()
    addToast('Test message', 'info')

    const toastId = useUiStore.getState().toasts[0].id
    removeToast(toastId)

    expect(useUiStore.getState().toasts).toHaveLength(0)
  })

  it('adds multiple toasts', () => {
    const { addToast } = useUiStore.getState()
    addToast('Message 1', 'success')
    addToast('Message 2', 'error')

    const toasts = useUiStore.getState().toasts
    expect(toasts).toHaveLength(2)
    expect(toasts[0].message).toBe('Message 1')
    expect(toasts[1].message).toBe('Message 2')
  })
})
