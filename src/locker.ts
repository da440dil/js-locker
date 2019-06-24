import { randomBytes } from 'crypto'

/** Gateway to storage to store a lock state. */
export interface Gateway {
  /**
   * Inserts key value and ttl of key if key value not exists.
   * Returns -1 on success, ttl in milliseconds on failure.
   */
  insert(key: string, value: string, ttl: number): Promise<number>
  /**
   * Inserts key value and ttl of key if key value not exists.
   * Updates ttl of key if key value equals input value.
   * Returns -1 on success, ttl in milliseconds on failure.
   */
  upsert(key: string, value: string, ttl: number): Promise<number>
  /**
   * Removes key if key value equals input value.
   * Returns true on success, false on failure.
   */
  remove(key: string, value: string): Promise<boolean>
}

/** Error message which is thrown when Locker constructor receives invalid value of ttl. */
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
  public createLock(key: string): Lock {
    return new Lock(this._gateway, this._params, key)
  }
  /** Creates and applies new Lock. Throws TTLError if Lock failed to lock the key. */
  public async lock(key: string): Promise<Lock> {
    const lock = this.createLock(key)
    const ttl = await lock.lock()
    if (ttl !== -1) {
      throw new TTLError(ttl)
    }
    return lock
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
  private _storage: Gateway
  private _ttl: number
  private _retryCount: number
  private _retryDelay: number
  private _retryJitter: number
  private _key: string
  private _token: string
  constructor(storage: Gateway, { ttl, retryCount, retryDelay, retryJitter, prefix }: Required<Params>, key: string) {
    this._storage = storage
    this._ttl = ttl
    this._retryCount = retryCount
    this._retryDelay = retryDelay
    this._retryJitter = retryJitter
    this._key = prefix + key
    this._token = ''
  }
  /** Applies the lock. Returns -1 on success, ttl in milliseconds on failure. */
  public lock(): Promise<number> {
    if (this._token === '') {
      return this._create()
    }
    return this._update()
  }
  /** Releases the lock. Returns true on success, false on failure. */
  public unlock(): Promise<boolean> {
    const token = this._token
    if (token === '') {
      return Promise.resolve(false)
    }
    this._token = ''
    return this._storage.remove(this._key, token)
  }
  private async _create(): Promise<number> {
    const token = await createToken()
    return this._insert(token, this._retryCount)
  }
  private async _insert(token: string, counter: number): Promise<number> {
    const v = await this._storage.insert(this._key, token, this._ttl)
    if (v === -1) {
      this._token = token
      return v
    }
    if (counter <= 0) {
      return v
    }
    counter--
    await sleep(createDelay(this._retryDelay, this._retryJitter))
    return this._insert(token, counter)
  }
  private async _update(): Promise<number> {
    const v = await this._storage.upsert(this._key, this._token, this._ttl)
    if (v === -1) {
      return v
    }
    this._token = ''
    return this._create()
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
