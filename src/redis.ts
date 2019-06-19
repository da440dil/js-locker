import { RedisClient } from 'redis'

/** Error message which is thrown when Redis command returns response of invalid type. */
export const ErrInvalidResponse = 'Invalid response'

/** Error message which is thrown when Redis key exists and has no TTL. */
export const ErrKeyNameClash = 'Key name clash'

const INSERT = '' +
  'if redis.call("set", KEYS[1], ARGV[1], "nx", "px", ARGV[2]) == false then ' +
  'return redis.call("pttl", KEYS[1]) ' +
  'end ' +
  'return nil'
const UPSERT = '' +
  'local v = redis.call("get", KEYS[1])' +
  'if v == ARGV[1] then ' +
  'redis.call("pexpire", KEYS[1], ARGV[2]) ' +
  'return nil ' +
  'end ' +
  'if v == false then ' +
  'redis.call("set", KEYS[1], ARGV[1], "px", ARGV[2]) ' +
  'return nil ' +
  'end ' +
  'return redis.call("pttl", KEYS[1])'
const REMOVE = '' +
  'if redis.call("get", KEYS[1]) == ARGV[1] then ' +
  'return redis.call("del", KEYS[1]) ' +
  'end'

export class Gateway {
  private _client: RedisClient
  constructor(client: RedisClient) {
    this._client = client
  }
  public insert(key: string, value: string, ttl: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this._client.eval(INSERT, 1, key, value, ttl, (err, res) => {
        if (err) {
          return reject(err)
        }
        if (res == null) {
          return resolve(-1)
        }
        if (Number(res) !== res) {
          return reject(new Error(ErrInvalidResponse))
        }
        if (res === -1) {
          return reject(new Error(ErrKeyNameClash))
        }
        resolve(res)
      })
    })
  }
  public upsert(key: string, value: string, ttl: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this._client.eval(UPSERT, 1, key, value, ttl, (err, res) => {
        if (err) {
          return reject(err)
        }
        if (res == null) {
          return resolve(-1)
        }
        if (Number(res) !== res) {
          return reject(new Error(ErrInvalidResponse))
        }
        if (res === -1) {
          return reject(new Error(ErrKeyNameClash))
        }
        resolve(res)
      })
    })
  }
  public remove(key: string, value: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this._client.eval(REMOVE, 1, key, value, (err, res) => {
        if (err) {
          return reject(err)
        }
        if (res == null) {
          return resolve(false)
        }
        if (Number(res) !== res) {
          return reject(new Error(ErrInvalidResponse))
        }
        resolve(res === 1)
      })
    })
  }
}
