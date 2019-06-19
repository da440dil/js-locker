import { createClient } from 'redis'
import Locker from '..'

// Decorator to log output of Locker methods call
class MyLocker {
  private _locker: Locker.Locker
  private _key: string
  private _id: number
  private _lock: Locker.Lock | null
  constructor(locker: Locker.Locker, key: string, id: number) {
    this._locker = locker
    this._key = key
    this._id = id
    this._lock = null
  }
  public async lock(): Promise<void> {
    try {
      this._lock = await this._locker.lock(this._key)
      console.log(`Locker#${this._id} has locked the key`)
    } catch (err) {
      if (err instanceof Locker.Error) {
        console.log(`Locker#${this._id} has failed to lock the key, retry after ${err.ttl} ms`)
      } else {
        throw err
      }
    }
  }
  public async unlock(): Promise<void> {
    if (this._lock === null) {
      return
    }
    const ok = await this._lock.unlock()
    if (ok) {
      console.log(`Locker#${this._id} has unlocked the key`)
      this._lock = null
    } else {
      console.log(`Locker#${this._id} has failed to unlock the key`)
    }
  }
}

(async function main() {
  const client = createClient()
  const ttl = 100
  const params = { ttl }
  const key = 'key'
  const locker1 = new MyLocker(Locker(client, params), key, 1)
  const locker2 = new MyLocker(Locker(client, params), key, 2)

  await locker1.lock()   // Locker#1 has locked the key
  await locker2.lock()   // Locker#2 has failed to lock the key, retry after 99 ms
  await sleep(200)
  console.log('Timeout 200 ms is up')
  await locker2.lock()   // Locker#2 has locked the key
  await locker1.lock()   // Locker#1 has failed to lock the key, retry after 98 ms
  await locker2.unlock() // Locker#2 has unlocked the key
  await locker1.lock()   // Locker#1 has locked the key
  await locker1.unlock() // Locker#1 has unlocked the key

  client.quit()
})()

function sleep(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}
