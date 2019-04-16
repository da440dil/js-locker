type Data = {
  value: string;
  ttl: number;
}

export class Storage {
  private _db: Map<string, Data>;
  private _timeout: number;
  private _timer?: NodeJS.Timeout;
  /**
   * @param refreshInterval Interval to remove stale keys in milliseconds.
   */
  constructor(refreshInterval: number) {
    this._db = new Map()
    this._timeout = refreshInterval
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
