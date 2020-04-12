import { IOkTTL, IOk } from '../IGateway';
import { IValueTTL } from './MemoryGateway';

interface IValueExpiresAt {
  value: string;
  expiresAt: number;
}

export class MemoryStorage {
  private items: Map<string, IValueExpiresAt>;

  constructor() {
    this.items = new Map();
  }

  public set(key: string, value: string, ttl: number): IOkTTL {
    const now = Date.now();
    const item = this.items.get(key);
    if (item !== undefined) {
      const exp = item.expiresAt - now;
      if (exp > 0) {
        if (item.value === value) {
          item.expiresAt = now + ttl;
          return { ok: true, ttl };
        }
        return { ok: false, ttl: exp };
      }
    }
    this.items.set(key, { value, expiresAt: now + ttl });
    return { ok: true, ttl };
  }

  public del(key: string, value: string): IOk {
    const item = this.items.get(key);
    if (item !== undefined && item.value === value) {
      this.items.delete(key);
      return { ok: true };
    }
    return { ok: false };
  }

  /** Deletes expired keys. Expected to be called at regular intervals. */
  public deleteExpired() {
    const now = Date.now();
    for (const [k, v] of this.items) {
      const exp = v.expiresAt - now;
      if (exp <= 0) {
        this.items.delete(k);
      }
    }
  }

  /** Gets value and TTL of a key. For testing. */
  public get(key: string): IValueTTL {
    const item = this.items.get(key);
    if (item !== undefined) {
      const exp = item.expiresAt - Date.now();
      if (exp > 0) {
        return { value: item.value, ttl: exp };
      }
    }
    return { value: '', ttl: -2 };
  }
}
