import { Gateway, OkTTL, Ok } from './gateway'

/** Lock implements distributed locking. */
export class Lock {
  private _gateway: Gateway
  private _ttl: number
  private _key: string
  private _token: string
  constructor({ gateway, ttl, key, token }: {
    gateway: Gateway;
    ttl: number;
    key: string;
    token: string;
  }) {
    this._gateway = gateway
    this._ttl = ttl
    this._key = key
    this._token = token
  }
  /** Applies the lock. */
  lock(): Promise<OkTTL> {
    return this._gateway.set(this._key, this._token, this._ttl)
  }
  /** Releases the lock. */
  unlock(): Promise<Ok> {
    return this._gateway.del(this._key, this._token)
  }
}
