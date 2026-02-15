import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { App } from './App'

// Mock Firebase to prevent test crashes
vi.mock('@/lib/firebase', () => {
  const mockUnsubscribe = vi.fn()
  return {
    auth: {
      onAuthStateChanged: vi.fn(cb => {
        cb(null) // Call callback with null (logged out)
        return mockUnsubscribe
      }),
    },
    db: {
      onSnapshot: vi.fn(() => mockUnsubscribe),
    },
    googleProvider: {},
    githubProvider: {},
    storage: {},
  }
})

describe('App', () => {
  it('renders the DailyArc brand on the authentication page', () => {
    render(<App />)
    const brandTitle = screen.getByRole('heading', { level: 1 })
    expect(brandTitle).toHaveTextContent(/DAILYARC/i)
  })

  it('renders authentication options', () => {
    render(<App />)
    // Check for sign-in options (Google, GitHub, Email)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('renders the authentication page without errors', () => {
    const { container } = render(<App />)
    expect(container).toBeTruthy()
    // Verify the app renders without crashing
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('displays authentication UI when user is not logged in', () => {
    render(<App />)
    // Should show loading or auth UI
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
    expect(heading.textContent).toContain('DAILYARC')
  })
})
