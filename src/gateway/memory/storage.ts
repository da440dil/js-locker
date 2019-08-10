import { OkTTL, Ok } from '../../gateway'

interface Item {
  value: string
  expiresAt: number
}

export interface ValueTTL {
  value: string
  ttl: number
}

export class Storage {
  private _items: Map<string, Item>
  constructor() {
    this._items = new Map()
  }
  async set(key: string, value: string, ttl: number): Promise<OkTTL> {
    const now = Date.now()
    const item = this._items.get(key)
    if (item !== undefined) {
      const exp = item.expiresAt - now
      if (exp > 0) {
        if (item.value === value) {
          item.expiresAt = now + ttl
          return { ok: true, ttl }
        }
        return { ok: false, ttl: exp }
      }
    }
    this._items.set(key, { value, expiresAt: now + ttl })
    return { ok: true, ttl }
  }
  async del(key: string, value: string): Promise<Ok> {
    const item = this._items.get(key)
    if (item !== undefined && item.value === value) {
      this._items.delete(key)
      return { ok: true }
    }
    return { ok: false }
  }
  deleteExpired() {
    const now = Date.now()
    for (const [k, v] of this._items) {
      const exp = v.expiresAt - now
      if (exp <= 0) {
        this._items.delete(k)
      }
    }
  }
  get(key: string): ValueTTL {
    const item = this._items.get(key)
    if (item !== undefined) {
      const exp = item.expiresAt - Date.now()
      if (exp > 0) {
        return { value: item.value, ttl: exp }
      }
    }
    return { value: '', ttl: -2 }
  }
}
