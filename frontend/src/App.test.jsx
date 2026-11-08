// Tests for the starter's App component.
import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App.jsx'

describe('App', () => {
  it('renders the heading and the counter at zero', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Get started')
    expect(screen.getByRole('button', { name: /count is 0/i })).toBeTruthy()
  })

  it('increments the counter on click', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /count is 0/i }))

    expect(screen.getByRole('button', { name: /count is 1/i })).toBeTruthy()
  })
})
