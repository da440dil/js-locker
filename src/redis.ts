import { RedisClient } from 'redis'

/** Error message which is thrown when Redis command returns response of invalid type. */
export const ErrInvalidResponse = 'Invalid response'

/** Error message which is thrown when Redis key exists and has no TTL. */
export const ErrKeyNameClash = 'Key name clash'

const SET = '' +
  'local v = redis.call("get", KEYS[1]) ' +
  'if v == false then ' +
  'redis.call("set", KEYS[1], ARGV[1], "px", ARGV[2]) ' +
  'return -2 ' +
  'end ' +
  'if v == ARGV[1] then ' +
  'redis.call("pexpire", KEYS[1], ARGV[2]) ' +
  'return -2 ' +
  'end ' +
  'return redis.call("pttl", KEYS[1])'

const DEL = '' +
  'if redis.call("get", KEYS[1]) == ARGV[1] then ' +
  'return redis.call("del", KEYS[1]) ' +
  'end ' +
  'return 0'

export class Gateway {
  private _client: RedisClient
  constructor(client: RedisClient) {
    this._client = client
  }
  set(key: string, value: string, ttl: number): Promise<{ ok: boolean; ttl: number; }> {
    return new Promise((resolve, reject) => {
      this._client.eval(SET, 1, key, value, ttl, (err, res) => {
        if (err) {
          return reject(err)
        }
        const t = parseInt(res, 10)
        if (isNaN(t)) {
          return reject(new Error(ErrInvalidResponse))
        }
        if (t === -1) {
          return reject(new Error(ErrKeyNameClash))
        }
        if (t === -2) {
          return resolve({ ok: true, ttl })
        }
        resolve({ ok: false, ttl: t })
      })
    })
  }
  del(key: string, value: string): Promise<{ ok: boolean; }> {
    return new Promise((resolve, reject) => {
      this._client.eval(DEL, 1, key, value, (err, res) => {
        if (err) {
          return reject(err)
        }
        const n = parseInt(res, 10)
        if (isNaN(n)) {
          return reject(new Error(ErrInvalidResponse))
        }
        resolve({ ok: n === 1 })
      })
    })
  }
}
