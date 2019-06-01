import {
  Storage,
  Locker,
  Lock,
  ErrInvalidTTL,
  ErrInvalidRetryCount,
  ErrInvalidRetryDelay,
  ErrInvalidRetryJitter,
  LockerError,
} from './locker'

const storage = {} as Storage
const key = 'key'

it('should throw Error if got invalid ttl parameter', () => {
  expect(() => new Locker(storage, { ttl: 0 })).toThrow(new Error(ErrInvalidTTL))
})

it('should throw Error if got invalid retryCount parameter', () => {
  expect(() => new Locker(storage, { ttl: 1, retryCount: -1 })).toThrow(new Error(ErrInvalidRetryCount))
})

it('should throw Error if got invalid retryDelay parameter', () => {
  expect(() => new Locker(storage, { ttl: 1, retryDelay: -1 })).toThrow(new Error(ErrInvalidRetryDelay))
})

it('should throw Error if got invalid retryJitter parameter', () => {
  expect(() => new Locker(storage, { ttl: 1, retryJitter: -1 })).toThrow(new Error(ErrInvalidRetryJitter))
})

it('should create Lock', () => {
  const locker = new Locker(storage, { ttl: 1 })
  expect(locker.createLock('')).toBeInstanceOf(Lock)
})

it('should lock', async () => {
  const insert = jest.fn().mockResolvedValue(-1)
  storage.insert = insert

  const locker = new Locker(storage, { ttl: 1 })
  await expect(locker.lock(key)).resolves.toBeInstanceOf(Lock)
})

it('should throw LockerError if lock failed', async () => {
  const ttl = 42
  const insert = jest.fn().mockResolvedValue(ttl)
  storage.insert = insert

  const locker = new Locker(storage, { ttl: 1 })
  await expect(locker.lock(key)).rejects.toThrow(new LockerError(ttl))
})
