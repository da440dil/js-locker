import { createClient } from 'redis'
import { LockerFactory, Locker } from '.'
import { Storage } from './redis'

// Wrapper to log output of Locker methods call
class MyLocker {
  private _locker: Locker;
  private _id: number;
  constructor(locker: Locker, id: number) {
    this._locker = locker
    this._id = id
  }
  async lock() {
    const v = await this._locker.lock()
    if (v === -1) {
      console.log(`Locker#${this._id} has locked the key`)
    } else {
      console.log(`Locker#${this._id} has failed to lock the key, retry after ${v} ms`)
    }
  }
  async unlock() {
    const ok = await this._locker.unlock()
    if (ok) {
      console.log(`Locker#${this._id} has unlocked the key`)
    } else {
      console.log(`Locker#${this._id} has failed to unlock the key`)
    }
  }
}

(async function main() {
  const db = 10
  const ttl = 100
  const key = 'key'
  // Create Redis client
  const client = createClient({ db: db })
  // Create Redis storage
  const storage = new Storage(client)
  const params = { ttl: ttl }
  const factory = new LockerFactory(storage, params)
  // Create first locker
  const locker1 = new MyLocker(factory.createLocker(key), 1)
  // Create second locker
  const locker2 = new MyLocker(factory.createLocker(key), 2)

  await locker1.lock() // Locker#1 has locked the key
  await locker2.lock() // Locker#2 has failed to lock the key, retry after 99 ms
  await sleep(200)
  console.log('Timeout 200 ms is up')
  await locker2.lock()   // Locker#2 has locked the key
  await locker1.lock()   // Locker#1 has failed to lock the key, retry after 98 ms
  await locker2.unlock() // Locker#2 has unlocked the key
  await locker1.lock()   // Locker#1 has locked the key
  await locker1.unlock() // Locker#1 has unlocked the key

  // Close Redis connection
  client.quit()
})()

function sleep(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}
