import { createDelay } from './delay'

describe('delay', () => {
  it('should create delay', () => {
    expect(createDelay(100, 0)).toBe(100)

    const delay = createDelay(100, 20)
    expect(delay).toBeGreaterThanOrEqual(80)
    expect(delay).toBeLessThanOrEqual(120)
  })
})
