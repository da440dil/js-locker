import { randomBytes } from 'crypto'

/** Gateway to storage to store a lock state. */
export interface Gateway {
  /**
   * Sets key value and TTL of key if key not exists.
   * Updates TTL of key if key exists and key value equals input value.
   */
  set(key: string, value: string, ttl: number): Promise<OkTTL>

  /**
   * Deletes key if key value equals input value.
   */
  del(key: string, value: string): Promise<Ok>
}

export interface Ok {
  /** Operation success flag. */
  ok: boolean
}

export interface OkTTL extends Ok {
  /** TTL of a key in milliseconds. */
  ttl: number
}

/** Error message which is thrown when Locker constructor receives invalid value of TTL. */
export const ErrInvalidTTL = 'ttl must be an integer greater than zero'

/** Error message which is thrown when Locker constructor receives invalid value of retryCount. */
export const ErrInvalidRetryCount = 'retryCount must be an integer greater than or equal to zero'

/** Error message which is thrown when Locker constructor receives invalid value of retryDelay. */
export const ErrInvalidRetryDelay = 'retryDelay must be an integer greater than or equal to zero'

/** Error message which is thrown when Locker constructor receives invalid value of retryJitter. */
export const ErrInvalidRetryJitter = 'retryJitter must be an integer greater than or equal to zero'

/** Parameters for creating new Lock. */
export interface Params {
  /** TTL of a key in milliseconds. Must be greater than 0. */
  ttl: number
  /** Maximum number of retries if key is locked. Must be greater than or equal to 0. By default equals 0. */
  retryCount?: number
  /** Delay in milliseconds between retries if key is locked. Must be greater than or equal to 0. By default equals 0. */
  retryDelay?: number
  /**
   * Maximum time in milliseconds randomly added to delays between retries to improve performance under high contention.
   * Must be greater than or equal to 0. By default equals 0.
   */
  retryJitter?: number
  /** Prefix of a key. By default empty string. */
  prefix?: string
}

/** Locker defines parameters for creating new Lock. */
export class Locker {
  private _gateway: Gateway
  private _params: Required<Params>
  constructor(gateway: Gateway, { ttl, retryCount = 0, retryDelay = 0, retryJitter = 0, prefix = '' }: Params) {
    if (!(Number.isSafeInteger(ttl) && ttl > 0)) {
      throw new Error(ErrInvalidTTL)
    }
    if (!(Number.isSafeInteger(retryCount) && retryCount >= 0)) {
      throw new Error(ErrInvalidRetryCount)
    }
    if (!(Number.isSafeInteger(retryDelay) && retryDelay >= 0)) {
      throw new Error(ErrInvalidRetryDelay)
    }
    if (!(Number.isSafeInteger(retryJitter) && retryJitter >= 0)) {
      throw new Error(ErrInvalidRetryJitter)
    }
    this._gateway = gateway
    this._params = {
      ttl,
      retryCount,
      retryDelay,
      retryJitter,
      prefix,
    }
  }
  /** Creates new Lock. */
  createLock(key: string): Lock {
    return new Lock(this._gateway, this._params, key)
  }
  /** Creates and applies new Lock. Throws TTLError if Lock failed to lock the key. */
  async lock(key: string): Promise<Lock> {
    const lock = this.createLock(key)
    const res = await lock.lock()
    if (res.ok) {
      return lock
    }
    throw new TTLError(res.ttl)
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

/** Lock implements distributed locking. */
export class Lock {
  private _gateway: Gateway
  private _ttl: number
  private _retryCount: number
  private _retryDelay: number
  private _retryJitter: number
  private _key: string
  private _token: string
  constructor(gateway: Gateway, { ttl, retryCount, retryDelay, retryJitter, prefix }: Required<Params>, key: string) {
    this._gateway = gateway
    this._ttl = ttl
    this._retryCount = retryCount
    this._retryDelay = retryDelay
    this._retryJitter = retryJitter
    this._key = prefix + key
    this._token = ''
  }
  /** Applies the lock. */
  async lock(): Promise<OkTTL> {
    let token = this._token
    if (token === '') {
      token = await createToken()
    }
    return this._lock(token, this._retryCount)
  }
  /** Releases the lock. */
  async unlock(): Promise<Ok> {
    const token = this._token
    if (token === '') {
      return { ok: false }
    }
    this._token = ''
    return this._unlock(token)
  }
  private async _lock(token: string, counter: number): Promise<OkTTL> {
    const res = await this._gateway.set(this._key, token, this._ttl)
    if (res.ok) {
      this._token = token
      return res
    }
    if (counter <= 0) {
      this._token = ''
      return res
    }
    counter--
    await sleep(createDelay(this._retryDelay, this._retryJitter))
    return this._lock(token, counter)
  }
  private _unlock(token: string): Promise<Ok> {
    return this._gateway.del(this._key, token)
  }
}

function createToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    randomBytes(16, (err, buf) => {
      if (err) {
        return reject(err)
      }
      resolve(buf.toString('base64'))
    })
  })
}

function createDelay(retryDelay: number, retryJitter: number): number {
  if (retryJitter === 0) {
    return retryDelay
  }
  return Math.max(0, retryDelay + Math.floor((Math.random() * 2 - 1) * retryJitter))
}

function sleep(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}
