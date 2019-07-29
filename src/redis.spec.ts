import { createClient, RedisClient, Callback } from 'redis'
import { Gateway, ErrInvalidResponse, ErrKeyNameClash } from './redis'

const redisUrl = 'redis://localhost:6379/10'
let client: RedisClient

const key = 'key'
const value = 'value'
const ttl = 100
let gateway: Gateway

beforeAll(async () => {
  client = createClient({ url: redisUrl })
  await delKey()
})

afterAll(() => {
  client.quit()
})

describe('Redis Gateway', () => {
  beforeEach(() => {
    gateway = new Gateway(client)
  })

  afterEach(async () => {
    await delKey()
  })

  it('should set key value and TTL of key if key not exists', async () => {
    const res = await gateway.set(key, value, ttl)
    expect(res.ok).toBe(true)
    expect(res.ttl).toBe(-1)

    let k = await getKey()
    expect(k.value).toBe(value)
    expect(k.ttl).toBeGreaterThan(0)
    expect(k.ttl).toBeLessThanOrEqual(ttl)

    await sleep(ttl)

    k = await getKey()
    expect(k.value).toBe(null)
    expect(k.ttl).toBe(-2)
  })

  it('should update TTL of key if key exists and key value equals input value', async () => {
    await gateway.set(key, value, ttl)

    const res = await gateway.set(key, value, ttl)
    expect(res.ok).toBe(true)
    expect(res.ttl).toBe(-1)

    let k = await getKey()
    expect(k.value).toBe(value)
    expect(k.ttl).toBeGreaterThan(0)
    expect(k.ttl).toBeLessThanOrEqual(ttl)

    await sleep(ttl)

    k = await getKey()
    expect(k.value).toBe(null)
    expect(k.ttl).toBe(-2)
  })

  it('should neither set key value nor update TTL of key if key exists and key value not equals input value', async () => {
    await setKey(value)
    const t = Math.floor(ttl / 2)
    await setTTL(t)

    const res = await gateway.set(key, `${value}#${value}`, ttl)
    expect(res.ok).toBe(false)
    expect(res.ttl).toBeGreaterThan(0)
    expect(res.ttl).toBeLessThanOrEqual(t)

    const k = await getKey()
    expect(k.value).toBe(value)
    expect(k.ttl).toBeGreaterThan(0)
    expect(k.ttl).toBeLessThanOrEqual(t)
  })

  it('should delete key if key value equals input value', async () => {
    await setKey(value)

    const res = await gateway.del(key, value)
    expect(res.ok).toBe(true)

    const k = await getKey()
    expect(k.value).toBe(null)
    expect(k.ttl).toBe(-2)
  })

  it('should not delete key if key value not equals input value', async () => {
    await setKey(value)

    const res = await gateway.del(key, `${value}#${value}`)
    expect(res.ok).toBe(false)

    const k = await getKey()
    expect(k.value).toBe(value)
    expect(k.ttl).toBe(-1)
  })

  it('should throw Error if key exists and has no TTL', async () => {
    await setKey('1')

    await expect(gateway.set(key, value, ttl)).rejects.toThrow(new Error(ErrKeyNameClash))
  })

  it('should throw Error if redis throws Error', async () => {
    const evalMock = jest.spyOn(client, 'eval')
    const err = new Error('any')
    evalMock.mockImplementation(makeEvalFn(err, 0))

    await expect(gateway.set(key, value, ttl)).rejects.toThrow(err)
    await expect(gateway.del(key, value)).rejects.toThrow(err)

    evalMock.mockRestore()
  })

  it('should throw Error if redis returns response of invalid type', async () => {
    const evalMock = jest.spyOn(client, 'eval')
    const err = new Error(ErrInvalidResponse)

    evalMock.mockImplementation(makeEvalFn(null, ''))
    await expect(gateway.set(key, value, ttl)).rejects.toThrow(err)
    await expect(gateway.del(key, value)).rejects.toThrow(err)

    evalMock.mockRestore()
  })
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

function getKey(): Promise<{ value: string; ttl: number; }> {
  return new Promise((resolve, reject) => {
    client.multi().get(key).pttl(key).exec((err, res) => {
      if (err) {
        return reject(err)
      }
      resolve({
        value: res[0],
        ttl: res[1],
      })
    })
  })
}

function setKey(v: string): Promise<void> {
  return new Promise((resolve, reject) => {
    client.set(key, v, (err) => {
      if (err) {
        return reject(err)
      }
      resolve()
    })
  })
}

function setTTL(t: number): Promise<void> {
  return new Promise((resolve, reject) => {
    client.pexpire(key, t, (err) => {
      if (err) {
        return reject(err)
      }
      resolve()
    })
  })
}

function sleep(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}

function makeEvalFn(err: Error | null, res: string | number) {
  return (...args: Array<string | number | Callback<string | number>>): boolean => {
    const cb = args[args.length - 1]
    if (typeof cb === 'function') {
      cb(err, res)
    }
    return false
  }
}
