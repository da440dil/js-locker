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
    gateway.insert = jest.fn().mockResolvedValue(-1)
    gateway.upsert = jest.fn().mockResolvedValue(-1)

    const v1 = await lock.lock()
    const v2 = await lock.lock()
    expect(v1).toBe(-1)
    expect(v2).toBe(-1)
    expect(gateway.insert).toBeCalledTimes(1)
    expect(gateway.upsert).toBeCalledTimes(1)
    const a1 = gateway.insert.mock.calls[0]
    const a2 = gateway.upsert.mock.calls[0]
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
    gateway.insert = jest.fn().mockResolvedValue(-1)
    gateway.remove = jest.fn().mockResolvedValue(true)

    await lock.lock()
    const v1 = await lock.unlock()
    const v2 = await lock.unlock()
    expect(v1).toBe(true)
    expect(v2).toBe(false)
    expect(gateway.remove).toBeCalledTimes(1)
    const a = gateway.remove.mock.calls[0]
    expect(a.length).toBe(2)
    expect(a[0]).toBe(prefix + key)
    expect(typeof a[1] === 'string').toBe(true)
  })

  it('should retry lock if key is locked', async () => {
    gateway.insert = jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(-1)

    const v = await lock.lock()
    expect(v).toBe(-1)
    expect(gateway.insert).toBeCalledTimes(2)
  })

  it('should retry lock while retryCount greater than zero', async () => {
    gateway.insert = jest.fn().mockResolvedValue(1)

    const v = await lock.lock()
    expect(v).toBe(1)
    expect(gateway.insert).toBeCalledTimes(retryCount + 1)
  })
})
