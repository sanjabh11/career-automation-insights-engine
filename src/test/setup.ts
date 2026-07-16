import '@testing-library/jest-dom'

// Suppress console.error in tests unless explicitly testing for it
const originalError = console.error
beforeEach(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('not wrapped in act')) return
    originalError.call(console, ...args)
  }
})

afterEach(() => {
  console.error = originalError
})
