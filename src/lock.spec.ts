import { Gateway } from './gateway'
import { Lock } from './lock'

const gateway = {} as jest.Mocked<Gateway>

describe('Lock', () => {
  const key = 'key'
  const ttl = 100
  const token = 'token'
  let lock: Lock

  beforeEach(() => {
    lock = new Lock({ gateway, ttl, key, token })
  })

  it('should lock', async () => {
    gateway.set = jest.fn()
      .mockResolvedValueOnce({ ok: true, ttl: -1 })
      .mockResolvedValueOnce({ ok: false, ttl: 42 })

    const r1 = await lock.lock()
    const r2 = await lock.lock()
    expect(r1).toStrictEqual({ ok: true, ttl: -1 })
    expect(r2).toStrictEqual({ ok: false, ttl: 42 })
    expect(gateway.set).toBeCalledTimes(2)
    expect(gateway.set.mock.calls).toEqual([[key, token, ttl], [key, token, ttl]])
  })

  it('should unlock', async () => {
    gateway.del = jest.fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false })

    const r1 = await lock.unlock()
    const r2 = await lock.unlock()
    expect(r1).toStrictEqual({ ok: true })
    expect(r2).toStrictEqual({ ok: false })
    expect(gateway.del).toBeCalledTimes(2)
    expect(gateway.del.mock.calls).toEqual([[key, token], [key, token]])
  })
})
