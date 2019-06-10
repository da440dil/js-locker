import {
  Storage,
  Lock,
} from './locker'

const storage = {} as jest.Mocked<Storage>
const key = 'key'
const ttl = 1000
const retryCount = 2
const retryDelay = 20
const retryJitter = 0
const prefix = 'lock#'

it('should lock', async () => {
  storage.insert = jest.fn().mockResolvedValue(-1)
  storage.upsert = jest.fn().mockResolvedValue(-1)
  const lock = new Lock(storage, { ttl, retryCount, retryDelay, retryJitter, prefix }, key)

  const v1 = await lock.lock()
  const v2 = await lock.lock()
  expect(v1).toBe(-1)
  expect(v2).toBe(-1)
  expect(storage.insert).toBeCalledTimes(1)
  expect(storage.upsert).toBeCalledTimes(1)
  const a1 = storage.insert.mock.calls[0]
  const a2 = storage.upsert.mock.calls[0]
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
  storage.insert = jest.fn().mockResolvedValue(-1)
  storage.remove = jest.fn().mockResolvedValue(true)
  const lock = new Lock(storage, { ttl, retryCount, retryDelay, retryJitter, prefix }, key)

  await lock.lock()
  const v1 = await lock.unlock()
  const v2 = await lock.unlock()
  expect(v1).toBe(true)
  expect(v2).toBe(false)
  expect(storage.remove).toBeCalledTimes(1)
  const a = storage.remove.mock.calls[0]
  expect(a.length).toBe(2)
  expect(a[0]).toBe(prefix + key)
  expect(typeof a[1] === 'string').toBe(true)
})

it('should retry lock if key is locked', async () => {
  storage.insert = jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(-1)
  const lock = new Lock(storage, { ttl, retryCount, retryDelay, retryJitter, prefix }, key)

  const v = await lock.lock()
  expect(v).toBe(-1)
  expect(storage.insert).toBeCalledTimes(2)
})

it('should retry lock while retryCount greater than 0', async () => {
  storage.insert = jest.fn().mockResolvedValue(1)
  const lock = new Lock(storage, { ttl, retryCount, retryDelay, retryJitter, prefix }, key)

  const v = await lock.lock()
  expect(v).toBe(1)
  expect(storage.insert).toBeCalledTimes(retryCount + 1)
})
