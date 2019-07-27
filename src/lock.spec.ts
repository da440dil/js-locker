import {
  Gateway,
  Lock,
} from './locker'

const gateway = {} as jest.Mocked<Gateway>

describe('Lock', () => {
  const key = 'key'
  const ttl = 1000
  const retryCount = 2
  const retryDelay = 20
  const retryJitter = 0
  const prefix = 'lock#'
  let lock: Lock

  beforeEach(() => {
    lock = new Lock(gateway, { ttl, retryCount, retryDelay, retryJitter, prefix }, key)
  })

  it('should lock', async () => {
    const v = { ok: true, ttl: -1 }
    gateway.set = jest.fn().mockResolvedValue(v)

    const r1 = await lock.lock()
    const r2 = await lock.lock()
    expect(r1).toStrictEqual(v)
    expect(r2).toStrictEqual(v)
    expect(gateway.set).toBeCalledTimes(2)
    const a1 = gateway.set.mock.calls[0]
    const a2 = gateway.set.mock.calls[1]
    expect(a1.length).toBe(3)
    expect(a2.length).toBe(3)
    const k = prefix + key
    expect(a1[0]).toBe(k)
    expect(a2[0]).toBe(k)
    expect(typeof a1[1] === 'string' && typeof a2[1] === 'string' && a1[1] === a2[1]).toBe(true)
    expect(a1[2]).toBe(ttl)
    expect(a2[2]).toBe(ttl)
  })

  it('should unlock', async () => {
    gateway.set = jest.fn().mockResolvedValue({ ok: true, ttl: -1 })
    const v = { ok: true }
    gateway.del = jest.fn().mockResolvedValue(v)

    await lock.lock()
    const r1 = await lock.unlock()
    const r2 = await lock.unlock()
    expect(r1).toStrictEqual(v)
    expect(r2).toStrictEqual({ ok: false })
    expect(gateway.del).toBeCalledTimes(1)
    const a = gateway.del.mock.calls[0]
    expect(a.length).toBe(2)
    expect(a[0]).toBe(prefix + key)
    expect(typeof a[1] === 'string').toBe(true)
  })

  it('should retry lock if key is locked', async () => {
    const v = { ok: true, ttl: -1 }
    gateway.set = jest.fn()
      .mockResolvedValueOnce({ ok: false, ttl: 42 })
      .mockResolvedValueOnce(v)

    const r = await lock.lock()
    expect(r).toStrictEqual(v)
    expect(gateway.set).toBeCalledTimes(2)
  })

  it('should retry lock while retryCount greater than zero', async () => {
    const v = { ok: false, ttl: 42 }
    gateway.set = jest.fn().mockResolvedValue(v)

    const r = await lock.lock()
    expect(r).toStrictEqual(v)
    expect(gateway.set).toBeCalledTimes(retryCount + 1)
  })
})
