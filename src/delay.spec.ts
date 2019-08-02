import { createDelay } from './delay'

describe('delay', () => {
  it('should create delay', () => {
    expect(createDelay(100, 0)).toBe(100)

    const testCases = [
      { retryDelay: 100, retryJitter: 20 },
      { retryDelay: 200, retryJitter: 50 },
      { retryDelay: 1000, retryJitter: 100 },
      { retryDelay: 100, retryJitter: 1000 },
    ]

    for (let { retryDelay, retryJitter } of testCases) {
      const delay = createDelay(retryDelay, retryJitter)
      if (retryDelay < retryJitter) {
        [retryDelay, retryJitter] = [retryJitter, retryDelay]
      }
      expect(delay).toBeGreaterThanOrEqual(retryDelay - retryJitter)
      expect(delay).toBeLessThanOrEqual(retryDelay + retryJitter)
    }
  })
})
