import { Gateway } from './gateway'
import { Gateway as MemoryGateway } from './gateway/memory/gateway'
import { createToken } from './token'
import { Lock } from './lock'

/** Error message which is thrown when Locker constructor receives invalid value of TTL. */
export const ErrInvalidTTL = 'ttl must be an integer greater than zero'

/** Error message which is thrown when when key size is greater than 512 MB. */
export const ErrInvalidKey = 'key size must be less than or equal to 512 MB'

/** Parameters for creating new Lock. */
export interface Params {
  /** TTL of a key in milliseconds. Must be greater than 0. */
  ttl: number
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
  private _ttl: number
  private _prefix: string
  constructor({ ttl, prefix = '', gateway = new MemoryGateway(100) }: Params) {
    if (!(Number.isSafeInteger(ttl) && ttl > 0)) {
      throw new Error(ErrInvalidTTL)
    }
    if (!isValidKey(prefix)) {
      throw new Error(ErrInvalidKey)
    }
    this._gateway = gateway
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
    const token = await createToken()
    return new Lock({
      gateway: this._gateway,
      ttl: this._ttl,
      key,
      token,
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
