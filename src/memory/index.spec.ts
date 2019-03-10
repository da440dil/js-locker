import 'mocha'
import assert from 'assert'
import { createStorage, Storage } from '.'

describe('memory storage', () => {
  let storage: Storage

  const key = 'key'
	const value = 'value'
  const ttl = 1000

  before(() => {
    storage = createStorage(ttl)
  })

  after(() => {
    storage.quit()
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

describe('memory storage ttl', () => {
  let storage: Storage

  const key = 'key'
	const value = 'value'
  const ttl = 100

  before(() => {
    storage = createStorage(ttl)
  })

  after(() => {
    storage.quit()
  })

  it('insert should return -1', async () => {
    const v = await storage.insert(key, value, ttl)
    assert(v === -1)
  })

  it('insert should return v >= 0 && v <= ttl', async () => {
    const v = await storage.insert(key, value, ttl)
    assert(v >= 0 && v <= ttl)
  })

  it('sleep', async() => {
    await sleep(200)
  })

  it('insert should return -1', async () => {
    const v = await storage.insert(key, value, ttl)
    assert(v === -1)
  })
})

function sleep(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}