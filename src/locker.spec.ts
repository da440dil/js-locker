import {
  Gateway,
  Locker,
  Lock,
  ErrInvalidTTL,
  ErrInvalidRetryCount,
  ErrInvalidRetryDelay,
  ErrInvalidRetryJitter,
  TTLError,
  ErrConflict,
} from './locker'

const gateway = {} as jest.Mocked<Gateway>

describe('Locker', () => {
  const key = 'key'
  let locker: Locker

  beforeEach(() => {
    locker = new Locker(gateway, { ttl: 1 })
  })

  describe('lock', () => {
    it('should throw Error if gateway#set throws Error', async () => {
      const err = new Error('any')
      gateway.set = jest.fn().mockRejectedValue(err)

      await expect(locker.lock(key)).rejects.toThrow(err)
    })

    it('should throw TTLError if gateway#set fails', async () => {
      const v = { ok: false, ttl: 42 }
      gateway.set = jest.fn().mockResolvedValue(v.ttl)

      await expect(locker.lock(key)).rejects.toThrow(new TTLError(v.ttl))
    })

    it('should not throw Error if gateway#set does not fail', async () => {
      const v = { ok: true, ttl: -1 }
      gateway.set = jest.fn().mockResolvedValue(v)

      await expect(locker.lock(key)).resolves.toBeInstanceOf(Lock)
    })
  })

  describe('createLock', () => {
    it('should create new Lock', () => {
      expect(locker.createLock(key)).toBeInstanceOf(Lock)
    })
  })
})

describe('Locker constructor', () => {
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
})

describe('TTLError constructor', () => {
  it('should create TTLError with ttl property', () => {
    const ttl = 42
    const err = new TTLError(ttl)
    expect(err.message).toBe(ErrConflict)
    expect(err.ttl).toBe(ttl)
  })
})
