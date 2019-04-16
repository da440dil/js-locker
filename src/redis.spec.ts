import 'mocha'
import assert from 'assert'
import { createClient, RedisClient } from 'redis'
import { Storage } from './redis'

describe('redis', () => {
  describe('Storage', () => {
    let client: RedisClient
    let storage: Storage

    const db = 10
    const key = 'key'
    const value = 'value'
    const ttl = 1000

    before(async () => {
      client = createClient({ db: db })
      await removeKey(client, key)
      storage = new Storage(client)
    })

    after(async () => {
      await removeKey(client, key)
      client.quit()
    })

    it('insert should return -1', async () => {
      const v = await storage.insert(key, value, ttl)
      assert(v === -1)
    })

    it('insert should return v >= 0 && v <= ttl', async () => {
      const v = await storage.insert(key, value, ttl)
      assert(v >= 0 && v <= ttl)
    })

    it('insert should return v >= 0 && v <= ttl', async () => {
      const v = await storage.insert(key, value, ttl)
      assert(v >= 0 && v <= ttl)
    })

    it('remove should return true', async () => {
      const v = await storage.remove(key, value)
      assert(v === true)
    })

    it('remove should return false', async () => {
      const v = await storage.remove(key, value)
      assert(v === false)
    })

    it('remove should return false', async () => {
      const v = await storage.remove(key, value)
      assert(v === false)
    })

    it('insert should return -1', async () => {
      const v = await storage.insert(key, value, ttl)
      assert(v === -1)
    })

    it('upsert should return -1', async () => {
      const v = await storage.upsert(key, value, ttl)
      assert(v === -1)
    })

    it('upsert should return -1', async () => {
      const v = await storage.upsert(key, value, ttl)
      assert(v === -1)
    })

    it('upsert should return v >= 0 && v <= ttl', async () => {
      const v = await storage.upsert(key, key, ttl)
      assert(v >= 0 && v <= ttl)
    })

    it('remove should return true', async () => {
      const v = await storage.remove(key, value)
      assert(v === true)
    })

    it('remove should return false', async () => {
      const v = await storage.remove(key, value)
      assert(v === false)
    })
  })

  describe('Storage ttl', () => {
    let client: RedisClient
    let storage: Storage

    const db = 10
    const key = 'key'
    const value = 'value'
    const ttl = 100

    before(async () => {
      client = createClient({ db: db })
      await removeKey(client, key)
      storage = new Storage(client)
    })

    after(async () => {
      await removeKey(client, key)
      client.quit()
    })

    it('insert should return -1', async () => {
      const v = await storage.insert(key, value, ttl)
      assert(v === -1)
    })

    it('insert should return v >= 0 && v <= ttl', async () => {
      const v = await storage.insert(key, value, ttl)
      assert(v >= 0 && v <= ttl)
    })

    it('sleep', async () => {
      await sleep(200)
    })

    it('insert should return -1', async () => {
      const v = await storage.insert(key, value, ttl)
      assert(v === -1)
    })
  })
})

function removeKey(client: RedisClient, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    client.del(key, (err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}

function sleep(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}
