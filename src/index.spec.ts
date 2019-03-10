import 'mocha'
import assert from 'assert'
import { createClient, RedisClient } from 'redis'
import * as RedisStorage from './redis'
import * as MemoryStorage from './memory'
import { createLocker, Locker, Lock } from '.'

describe('locker with redis storage', () => {
  let client: RedisClient
  let storage: RedisStorage.Storage
  let locker: Locker
  let l1: Lock
  let l2: Lock

  const db = 10
  const key = 'key'
  const ttl = 1000
  const retryCount = 2
  const retryDelay = 100

  before(async () => {
    client = createClient({ db: db })
    await removeKey(client, key)
    storage = RedisStorage.createStorage(client)
    locker = createLocker(storage, { ttl: ttl, retryCount: retryCount, retryDelay: retryDelay })
    l1 = locker.createLock(key)
    l2 = locker.createLock(key)
  })

  after(async () => {
    await removeKey(client, key)
    client.quit()
  })

  it("first locker.lock() should return -1", async () => {
    const v = await l1.lock()
    assert(v === -1)
  })

  it("first locker.lock() should return -1", async () => {
    const v = await l1.lock()
    assert(v === -1)
  })

  it("second locker.lock() should return v >= 0 && v <= ttl", async () => {
    const v = await l2.lock()
    assert(v >= 0 && v <= ttl)
  })

  it("first locker.unlock() should return true", async () => {
    const v = await l1.unlock()
    assert(v === true)
  })

  it("first locker.unlock() should return false", async () => {
    const v = await l1.unlock()
    assert(v === false)
  })

  it("second locker.lock() should return -1", async () => {
    const v = await l2.lock()
    assert(v === -1)
  })

  it("second locker.unlock() should return true", async () => {
    const v = await l2.unlock()
    assert(v === true)
  })

  it("second locker.lock() should return -1 after first locker.unlock() has been called", async () => {
    const v1 = await l1.lock()
    assert(v1 === -1)
    setTimeout(() => { l1.unlock() }, retryDelay)
    const v2 = await l2.lock()
    assert(v2 === -1)
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

describe('locker with memory storage', () => {
  let storage: MemoryStorage.Storage
  let factory: Locker
  let l1: Lock
  let l2: Lock

  const key = 'key'
  const ttl = 1000
  const retryCount = 2
  const retryDelay = 100

  before(() => {
    storage = MemoryStorage.createStorage(ttl)
    factory = createLocker(storage, { ttl: ttl, retryCount: retryCount, retryDelay: retryDelay })
    l1 = factory.createLock(key)
    l2 = factory.createLock(key)
  })

  after(() => {
    storage.quit()
  })

  it("first locker.lock() should return -1", async () => {
    const v = await l1.lock()
    assert(v === -1)
  })

  it("first locker.lock() should return -1", async () => {
    const v = await l1.lock()
    assert(v === -1)
  })

  it("second locker.lock() should return v >= 0 && v <= ttl", async () => {
    const v = await l2.lock()
    assert(v >= 0 && v <= ttl)
  })

  it("first locker.unlock() should return true", async () => {
    const v = await l1.unlock()
    assert(v === true)
  })

  it("first locker.unlock() should return false", async () => {
    const v = await l1.unlock()
    assert(v === false)
  })

  it("second locker.lock() should return -1", async () => {
    const v = await l2.lock()
    assert(v === -1)
  })

  it("second locker.unlock() should return true", async () => {
    const v = await l2.unlock()
    assert(v === true)
  })

  it("second locker.lock() should return -1 after first locker.unlock() has been called", async () => {
    const v1 = await l1.lock()
    assert(v1 === -1)
    setTimeout(() => { l1.unlock() }, retryDelay)
    const v2 = await l2.lock()
    assert(v2 === -1)
  })
})
