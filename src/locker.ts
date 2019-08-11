import { Gateway } from './gateway'
import { Gateway as MemoryGateway } from './gateway/memory/gateway'
import { Lock } from './lock'
import { Random, random as rand } from './random'

/** Error message which is thrown when Locker constructor receives invalid value of TTL. */
export const ErrInvalidTTL = 'ttl must be an integer greater than 0'

/** Error message which is thrown when key size is greater than 512 MB. */
export const ErrInvalidKey = 'key size must be less than or equal to 512 MB'

/** Error message which is thrown when random bytes size less than or equal to 0 */
export const ErrInvalidRandomBytesSize = 'random bytes size must be greater than 0'

/** Parameters for creating new Lock. */
export interface Params {
  /** TTL of a key in milliseconds. Must be greater than 0. */
  ttl: number
  /**
   * Random generator for generation lock tokens.
   * By default crypto.randomBytes.
   */
  random?: Random
  /**
   * Bytes size to read from random generator for generation lock tokens.
   * Must be greater than 0.
   * By default 16.
   */
  randomBytesSize?: number
  /**
   * Gateway to storage to store a lock state.
   * If gateway not defined counter creates new memory gateway
   * with expired keys cleanup every 100 milliseconds.
   */
  gateway?: Gateway
  /** Prefix of a key. By default empty string. */
  prefix?: string
}

/** Locker defines parameters for creating new Lock. */
export class Locker {
  private _gateway: Gateway
  private _random: Random
  private _randomBytesSize: number
  private _ttl: number
  private _prefix: string
  constructor({
    ttl,
    random = rand,
    randomBytesSize = 16,
    prefix = '',
    gateway = new MemoryGateway(100),
  }: Params) {
    if (!(Number.isSafeInteger(ttl) && ttl > 0)) {
      throw new Error(ErrInvalidTTL)
    }
    if (!(Number.isSafeInteger(randomBytesSize) && randomBytesSize > 0)) {
      throw new Error(ErrInvalidRandomBytesSize)
    }
    if (!isValidKey(prefix)) {
      throw new Error(ErrInvalidKey)
    }
    this._gateway = gateway
    this._random = random
    this._randomBytesSize = randomBytesSize
    this._ttl = ttl
    this._prefix = prefix
  }
  /** Creates and applies new Lock. Throws TTLError if Lock failed to lock the key. */
  async lock(key: string): Promise<Lock> {
    const lock = await this.createLock(key)
    const res = await lock.lock()
    if (res.ok) {
      return lock
    }
    throw new TTLError(res.ttl)
  }
  /** Creates new Lock. */
  async createLock(key: string): Promise<Lock> {
    key = this._prefix + key
    if (!isValidKey(key)) {
      throw new Error(ErrInvalidKey)
    }
    const buf = await this._random(this._randomBytesSize)
    return new Lock({
      gateway: this._gateway,
      ttl: this._ttl,
      key,
      token: buf.toString('base64'),
    })
  }
}

/** Error message which is thrown when lock failed. */
export const ErrConflict = 'Conflict'

/** Error which is thrown when Lock failed to lock the key. */
export class TTLError extends Error {
  private _ttl: number
  constructor(ttl: number) {
    super(ErrConflict)
    this._ttl = ttl
  }
  /** TTL of a key in milliseconds. */
  get ttl() {
    return this._ttl
  }
}

/** Maximum key size in bytes. */
export const MaxKeySize = 512000000

function isValidKey(key: string): boolean {
  return Buffer.byteLength(key, 'utf8') <= MaxKeySize
}
