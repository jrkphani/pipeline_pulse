/// <reference types="vitest/globals" />
/**
 * Vitest global test setup
 * Referenced by vitest.config.ts → test.setupFiles
 *
 * Add global mocks, jest-dom matchers, and test utilities here.
 * This file runs before every test file.
 */
import '@testing-library/jest-dom'
import { setupServer } from 'msw/node'
import { handlers } from '@/mocks/handlers'

// ---------------------------------------------------------------------------
// MSW server — intercepts fetch in Node for unit/integration tests
// ---------------------------------------------------------------------------

export const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Silence noisy console output in tests unless explicitly debugging.
// Set DEBUG_TESTS=1 in env to see all console output.
if (!process.env.DEBUG_TESTS) {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
}
