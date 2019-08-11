import { Gateway } from './gateway'
import { Lock } from './lock'
import {
  Locker,
  ErrInvalidTTL,
  ErrInvalidRandomBytesSize,
  ErrInvalidKey,
  TTLError,
  ErrConflict,
  MaxKeySize,
} from './locker'

const gateway = {} as jest.Mocked<Gateway>

const invalidKey = Buffer.alloc(MaxKeySize + 1).toString()

describe('Locker', () => {
  const key = 'key'
  let locker: Locker

  beforeEach(() => {
    locker = new Locker({ gateway, ttl: 1 })
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

    it('should throw Error if got invalid key', async () => {
      await expect(locker.lock(invalidKey)).rejects.toThrow(new Error(ErrInvalidKey))
    })

    it('should not throw Error if gateway#set does not fail', async () => {
      const v = { ok: true, ttl: -1 }
      gateway.set = jest.fn().mockResolvedValue(v)

      await expect(locker.lock(key)).resolves.toBeInstanceOf(Lock)
    })
  })

  describe('createLock', () => {
    it('should throw Error if got invalid key', async () => {
      await expect(locker.createLock(invalidKey)).rejects.toThrow(new Error(ErrInvalidKey))
    })

    it('should create new Lock', async () => {
      await expect(locker.createLock(key)).resolves.toBeInstanceOf(Lock)
    })
  })
})

describe('Locker constructor', () => {
  it('should throw Error if got invalid ttl parameter', () => {
    expect(() => new Locker({ ttl: 0 })).toThrow(new Error(ErrInvalidTTL))
  })

  it('should throw Error if got invalid randomBytesSize parameter', () => {
    expect(() => new Locker({ ttl: 1, randomBytesSize: 0 })).toThrow(new Error(ErrInvalidRandomBytesSize))
  })

  it('should throw Error if got invalid prefix parameter', () => {
    expect(() => new Locker({ ttl: 1, prefix: invalidKey })).toThrow(new Error(ErrInvalidKey))
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
