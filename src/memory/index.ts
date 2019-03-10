/**
 * Storage implements storage in memory.
 */
export interface Storage {
  insert(key: string, value: string, ttl: number): Promise<number>;
  upsert(key: string, value: string, ttl: number): Promise<number>;
  remove(key: string, value: string): Promise<boolean>;
  /** Stops refresh cycle. */
  quit(): void;
}

/**
 * Creates new Storage.
 * @param refreshInterval Interval to remove stale keys in milliseconds.
 */
export function createStorage(refreshInterval: number): Storage {
  return new MemoryStorage(refreshInterval)
}

type Data = {
  value: string;
  ttl: number;
}

class MemoryStorage {
  private _db: Map<string, Data>;
  private _timeout: number;
  private _timer?: NodeJS.Timeout;
  constructor(timeout: number) {
    this._db = new Map()
    this._timeout = timeout
    this._init()
  }
  private _init() {
    this._timer = setTimeout(() => {
      if (this._timer === undefined) {
        return
      }
      for (let [k, v] of this._db) {
        v.ttl = v.ttl - this._timeout
        if (v.ttl <= 0) {
          this._db.delete(k)
        }
      }
      this._init()
    }, this._timeout)
  }
  quit() {
    if (this._timer === undefined) {
      return
    }
    clearTimeout(this._timer)
    this._timer = undefined
  }
  async insert(key: string, value: string, ttl: number): Promise<number> {
    const v = this._db.get(key)
    if (v !== undefined) {
      return v.ttl
    }
    this._db.set(key, { value: value, ttl: ttl })
    return -1
  }
  async upsert(key: string, value: string, ttl: number): Promise<number> {
    const v = this._db.get(key)
    if (v === undefined) {
      this._db.set(key, { value: value, ttl: ttl })
      return -1
    }
    if (v.value === value) {
      v.ttl = ttl
      return -1
    }
    return v.ttl
  }
  async remove(key: string, value: string): Promise<boolean> {
    const v = this._db.get(key)
    if (v !== undefined && v.value === value) {
      this._db.delete(key)
      return true
    }
    return false
  }
}