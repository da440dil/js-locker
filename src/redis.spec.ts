import { createClient, RedisClient } from 'redis'
import { Storage } from './redis'

const redisUrl = 'redis://127.0.0.1:6379/10'
let client: RedisClient

const k = 'k'
const v = 'v'
const ttl = 1000
let storage: Storage

beforeAll(async () => {
  client = createClient({ url: redisUrl })
  await delKey(k)
})

afterAll(() => {
  client.quit()
})

beforeEach(() => {
  storage = new Storage(client)
})

afterEach(async () => {
  await delKey(k)
})

it('should set key value and ttl of key if key value not exists', async () => {
  const t1 = await storage.insert(k, v, ttl)
  expect(t1).toBe(-1)
  const r = await getKey(k)
  expect(r.v).toBe(v)
  expect(r.ttl > 0 && r.ttl <= ttl).toBe(true)

  const t2 = await storage.insert(k, v, ttl)
  expect(t2 > 0 && t2 <= ttl).toBe(true)

  await sleep(ttl)
  const t3 = await storage.insert(k, v, ttl)
  expect(t3).toBe(-1)
})

it('should update ttl of key if key value equals value', async () => {
  const t1 = await storage.upsert(k, v, ttl)
  expect(t1).toBe(-1)
  const r = await getKey(k)
  expect(r.v).toBe(v)
  expect(r.ttl > 0 && r.ttl <= ttl).toBe(true)

  const t2 = await storage.upsert(k, v, ttl)
  expect(t2).toBe(-1)

  const t3 = await storage.upsert(k, v + v, ttl)
  expect(t3 > 0 && t3 <= ttl).toBe(true)
})

it('should delete key if key value exists', async () => {
  await storage.insert(k, v, ttl)
  expect(await storage.remove(k, v)).toBe(true)
  const r = await getKey(k)
  expect(r.v).toBe(null)
  expect(r.ttl).toBe(-2)
  expect(await storage.remove(k, v)).toBe(false)
})

function delKey(key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    client.del(key, (err) => {
      if (err) {
        return reject(err)
      }
      resolve()
    })
  })
}

function getKey(key: string): Promise<{
  v: string;
  ttl: number;
}> {
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
