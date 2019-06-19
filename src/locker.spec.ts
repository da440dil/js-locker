import {
  Gateway,
  Locker,
  Lock,
  ErrInvalidTTL,
  ErrInvalidRetryCount,
  ErrInvalidRetryDelay,
  ErrInvalidRetryJitter,
  LockerError,
} from './locker'

const gateway = {} as jest.Mocked<Gateway>
const key = 'key'

it('should throw Error if got invalid ttl parameter', () => {
  expect(() => new Locker(gateway, { ttl: 0 })).toThrow(new Error(ErrInvalidTTL))
})

it('should throw Error if got invalid retryCount parameter', () => {
  expect(() => new Locker(gateway, { ttl: 1, retryCount: -1 })).toThrow(new Error(ErrInvalidRetryCount))
})

it('should throw Error if got invalid retryDelay parameter', () => {
  expect(() => new Locker(gateway, { ttl: 1, retryDelay: -1 })).toThrow(new Error(ErrInvalidRetryDelay))
})

it('should throw Error if got invalid retryJitter parameter', () => {
  expect(() => new Locker(gateway, { ttl: 1, retryJitter: -1 })).toThrow(new Error(ErrInvalidRetryJitter))
})

it('should create Lock', () => {
  const locker = new Locker(gateway, { ttl: 1 })
  expect(locker.createLock('')).toBeInstanceOf(Lock)
})

it('should lock', async () => {
  gateway.insert = jest.fn().mockResolvedValue(-1)

  const locker = new Locker(gateway, { ttl: 1 })
  await expect(locker.lock(key)).resolves.toBeInstanceOf(Lock)
})

it('should throw LockerError if lock failed', async () => {
  const ttl = 42
  const err = new LockerError(ttl)
  expect(err.ttl).toBe(ttl)

  gateway.insert = jest.fn().mockResolvedValue(ttl)

  const locker = new Locker(gateway, { ttl: 1 })
  await expect(locker.lock(key)).rejects.toThrow(err)
})
