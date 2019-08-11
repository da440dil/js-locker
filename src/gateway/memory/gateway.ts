import { Gateway as IGateway, OkTTL, Ok } from '../../gateway'
import { Storage } from './storage'

export interface ValueTTL {
  value: string
  ttl: number
}

/** Implements gateway to memory storage. */
export class Gateway implements IGateway {
  private _storage: Storage
  private _timer: NodeJS.Timer
  constructor(cleanupInterval: number) {
    this._storage = new Storage()
    this._timer = setInterval(() => {
      this._storage.deleteExpired()
    }, cleanupInterval)
    this._timer.unref()
  }
  set(key: string, value: string, ttl: number): Promise<OkTTL> {
    return this._storage.set(key, value, ttl)
  }
  del(key: string, value: string): Promise<Ok> {
    return this._storage.del(key, value)
  }
  get(key: string): ValueTTL {
    return this._storage.get(key)
  }
  stopCleanupTimer() {
    clearInterval(this._timer)
  }
}
