import { randomBytes } from 'crypto'

/** ErrInvalidTTL is the error message returned when createCounter receives invalid value of ttl. */
export const ErrInvalidTTL = 'ttl must be an integer greater than zero'
export const ErrInvalidRetryCount = 'retryCount must be an integer greater than or equal to zero'
export const ErrInvalidRetryDelay = 'retryDelay must be an integer greater than or equal to zero'
export const ErrInvalidRetryJitter = 'retryJitter must be an integer greater than or equal to zero'

/**
 * Locker defines parameters for creating new Lock.
 */
export interface Locker {
  createLock(key: string): Lock;
}

/**
 * Lock implements distributed locking.
 */
export interface Lock {
  /** Applies the lock, returns -1 on success, ttl in milliseconds on failure. */
  lock(): Promise<number>;
  /** Releases the lock, returns true on success. */
  unlock(): Promise<boolean>;
}

/**
 * Storage imlements key value storage.
 */
export interface Storage {
  /**
   * Sets key value and ttl of key if key value not exists, 
   * returns -1 on success, ttl in milliseconds on failure.
   */
  insert(key: string, value: string, ttl: number): Promise<number>;
  /**
   * Sets key value and ttl of key if key value not exists, 
   * updates ttl of key if key value equals value, 
   * returns -1 on success, ttl in milliseconds on failure.
   */
  upsert(key: string, value: string, ttl: number): Promise<number>;
  /**
   * Deletes key if key value exists, 
   * returns true on success.
   */
  remove(key: string, value: string): Promise<boolean>;
}

/**
 * Creates new Locker.
 */
export function createLocker(storage: Storage, { ttl, retryCount = 0, retryDelay = 0, retryJitter = 0, prefix = '' }: {
  /** TTL of key in milliseconds (must be greater than 0). */
  ttl: number;
  /** Maximum number of retries if key is locked 
   * (must be greater than or equal to 0, by default equals 0).
   */
  retryCount?: number;
  /** Delay in milliseconds between retries if key is locked
   * (must be greater than or equal to 0, by default equals 0).
   */
  retryDelay?: number;
  /** Maximum time in milliseconds randomly added to delays between retries 
   * to improve performance under high contention 
   * (must be greater than or equal to 0, by default equals 0).
   */
  retryJitter?: number;
  /** Prefix of a key. */
  prefix?: string;
}): Locker {
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
  return new LockerImpl(storage, ttl, retryCount, retryDelay, retryJitter, prefix)
}

class LockerImpl {
  private _storage: Storage;
  private _ttl: number;
  private _retryCount: number;
  private _retryDelay: number;
  private _retryJitter: number;
  private _prefix: string;
  constructor(storage: Storage, ttl: number, retryCount: number, retryDelay: number, retryJitter: number, prefix: string) {
    this._storage = storage
    this._ttl = ttl
    this._retryCount = retryCount
    this._retryDelay = retryDelay
    this._retryJitter = retryJitter
    this._prefix = prefix
  }
  createLock(key: string): Lock {
    return new LockImpl(this._storage, this._ttl, this._retryCount, this._retryDelay, this._retryJitter, this._prefix + key)
  }
}

class LockImpl {
  private _storage: Storage;
  private _ttl: number;
  private _retryCount: number;
  private _retryDelay: number;
  private _retryJitter: number;
  private _key: string;
  private _token: string;
  constructor(storage: Storage, ttl: number, retryCount: number, retryDelay: number, retryJitter: number, key: string) {
    this._storage = storage
    this._ttl = ttl
    this._retryCount = retryCount
    this._retryDelay = retryDelay
    this._retryJitter = retryJitter
    this._key = key
    this._token = ''
  }
  lock(): Promise<number> {
    if (this._token === '') {
      return this._create()
    }
    return this._update()
  }
  unlock(): Promise<boolean> {
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
    await sleep(Math.max(0, this._retryDelay + Math.floor((Math.random() * 2 - 1) * this._retryJitter)))
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
      if (err) return reject(err)
      resolve(buf.toString('base64'))
    })
  })
}

function sleep(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}
