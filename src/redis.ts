import { RedisClient } from 'redis'

/**
 * ErrInvalidResponse is the error message returned when Redis command returns response of invalid type.
 */
export const ErrInvalidResponse = 'Invalid response'
/**
 * ErrKeyNameClash is the error message returned when Redis key exists and has no TTL.
 */
export const ErrKeyNameClash = 'Key name clash'

const insert = 'if redis.call("set", KEYS[1], ARGV[1], "nx", "px", ARGV[2]) == false then return redis.call("pttl", KEYS[1]) end return nil'
const upsert = 'local v = redis.call("get", KEYS[1]) if v == ARGV[1] then redis.call("pexpire", KEYS[1], ARGV[2]) return nil end if v == false then redis.call("set", KEYS[1], ARGV[1], "px", ARGV[2]) return nil end return redis.call("pttl", KEYS[1])'
const remove = 'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) end return 0'

export class Storage {
  private _client: RedisClient;
  constructor(client: RedisClient) {
    this._client = client
  }
  insert(key: string, value: string, ttl: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this._client.eval(insert, 1, key, value, String(ttl), (err, res) => {
        if (err) {
          return reject(err)
        }
        if (res == null) {
          return resolve(-1)
        }
        if (typeof res !== 'number') {
          return reject(new Error(ErrInvalidResponse))
        }
        if (res === -1) {
          return reject(new Error(ErrKeyNameClash))
        }
        resolve(res)
      })
    })
  }
  upsert(key: string, value: string, ttl: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this._client.eval(upsert, 1, key, value, String(ttl), (err, res) => {
        if (err) {
          return reject(err)
        }
        if (res == null) {
          return resolve(-1)
        }
        if (typeof res !== 'number') {
          return reject(new Error(ErrInvalidResponse))
        }
        if (res === -1) {
          return reject(new Error(ErrKeyNameClash))
        }
        resolve(res)
      })
    })
  }
  remove(key: string, value: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this._client.eval(remove, 1, key, value, (err, res) => {
        if (err) {
          return reject(err)
        }
        if (typeof res !== 'number') {
          return reject(new Error(ErrInvalidResponse))
        }
        resolve(res === 1)
      })
    })
  }
}
