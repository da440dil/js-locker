import { createClient, RedisClient } from 'redis'
import { Gateway } from './redis'

const redisUrl = 'redis://127.0.0.1:6379/10'
let client: RedisClient

const key = 'key'
const value = 'value'
const ttl = 500
let gateway: Gateway

beforeAll(async () => {
  client = createClient({ url: redisUrl })
  await delKey()
})

afterAll(() => {
  client.quit()
})

beforeEach(() => {
  gateway = new Gateway(client)
})

afterEach(async () => {
  await delKey()
})

it('should set key value and ttl of key if key value not exists', async () => {
  const t1 = await gateway.insert(key, value, ttl)
  expect(t1).toBe(-1)
  const r1 = await getKey()
  expect(r1.v).toBe(value)
  expect(r1.ttl).toBeGreaterThan(0)
  expect(r1.ttl).toBeLessThanOrEqual(ttl)

  const t2 = await gateway.insert(key, value, ttl)
  expect(t2).toBeGreaterThan(0)
  expect(t2).toBeLessThanOrEqual(ttl)

  await sleep(ttl)
  const r = await getKey()
  expect(r.v).toBe(null)
  expect(r.ttl).toBe(-2)

  const t3 = await gateway.insert(key, value, ttl)
  expect(t3).toBe(-1)
  const r3 = await getKey()
  expect(r3.v).toBe(value)
  expect(r3.ttl).toBeGreaterThan(0)
  expect(r3.ttl).toBeLessThanOrEqual(ttl)
})

it('should update ttl of key if key value equals value', async () => {
  const t1 = await gateway.upsert(key, value, ttl)
  expect(t1).toBe(-1)
  const r1 = await getKey()
  expect(r1.v).toBe(value)
  expect(r1.ttl).toBeGreaterThan(0)
  expect(r1.ttl).toBeLessThanOrEqual(ttl)

  const t2 = await gateway.upsert(key, value, ttl)
  expect(t2).toBe(-1)

  const t3 = await gateway.upsert(key, value + value, ttl)
  expect(t3).toBeGreaterThan(0)
  expect(t3).toBeLessThanOrEqual(ttl)

  await sleep(ttl)
  const r = await getKey()
  expect(r.v).toBe(null)
  expect(r.ttl).toBe(-2)
})

it('should delete key if key value exists', async () => {
  await gateway.insert(key, value, ttl)

  const b1 = await gateway.remove(key, value)
  expect(b1).toBe(true)
  const r = await getKey()
  expect(r.v).toBe(null)
  expect(r.ttl).toBe(-2)

  const b2 = await gateway.remove(key, value)
  expect(b2).toBe(false)
})

function delKey(): Promise<void> {
  return new Promise((resolve, reject) => {
    client.del(key, (err) => {
      if (err) {
        return reject(err)
      }
      resolve()
    })
  })
}

function getKey(): Promise<{ v: string; ttl: number; }> {
  return new Promise((resolve, reject) => {
    client.multi().get(key).pttl(key).exec((err, res) => {
      if (err) {
        return reject(err)
      }
      resolve({
        v: res[0],
        ttl: res[1],
      })
    })
  })
}

function sleep(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}
