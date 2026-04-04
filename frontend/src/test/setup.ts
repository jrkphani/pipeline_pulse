/// <reference types="vitest/globals" />
/**
 * Vitest global test setup
 * Referenced by vitest.config.ts → test.setupFiles
 *
 * Add global mocks, jest-dom matchers, and test utilities here.
 * This file runs before every test file.
 */
import '@testing-library/jest-dom'

// Silence noisy console output in tests unless explicitly debugging.
// Set DEBUG_TESTS=1 in env to see all console output.
if (!process.env.DEBUG_TESTS) {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
}
