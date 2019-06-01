# js-locker

Distributed locking with pluggable storage.

## Example

```javascript
import { createClient } from 'redis'
import { Locker, Lock, LockerError } from '@da440dil/js-locker'
import { Storage } from '@da440dil/js-locker/lib/redis'

// Decorator to log output of Locker methods call
class MyLocker {
  private _locker: Locker
  private _key: string
  private _id: number
  private _lock: Lock | null
  constructor(locker: Locker, key: string, id: number) {
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
      if (err instanceof LockerError) {
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
  const db = 10
  const ttl = 100
  const key = 'key'
  // Create Redis client
  const client = createClient({ db })
  // Create Redis storage
  const storage = new Storage(client)
  const params = { ttl }
  // Create first locker
  const locker1 = new MyLocker(new Locker(storage, params), key, 1)
  // Create second locker
  const locker2 = new MyLocker(new Locker(storage, params), key, 2)

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
```