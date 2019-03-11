# js-locker

Distributed locking with pluggable storage.

## Example

```javascript
import { createClient } from 'redis'
import { createStorage } from '@da440dil/js-locker/lib/redis'
import { createLocker, Lock } from '@da440dil/js-locker'

class MyLock {
  private _lock: Lock;
  private _id: number;
  constructor(lock: Lock, id: number) {
    this._lock = lock
    this._id = id
  }
  async lock() {
    const v = await this._lock.lock()
    if (v === -1) {
      console.log(`Lock#${this._id} has locked the key`)
    } else {
      console.log(`Lock#${this._id} has failed to lock the key, retry after ${v} ms`)
    }
  }
  async unlock() {
    const ok = await this._lock.unlock()
    if (ok) {
      console.log(`Locker${this._id} has unlocked the key`)
    } else {
      console.log(`Locker#${this._id} has failed to unlock the key`)
    }
  }
}

main()

async function main() {
  const db = 10
  const ttl = 100
  const key = 'key'
  // Create Redis client
  const client = createClient({ db: db })
  // Create Redis storage
  const storage = createStorage(client)
  const params = { ttl: ttl }
  const locker = createLocker(storage, params)
  // Create first lock
  const lock1 = new MyLock(locker.createLock(key), 1)
  // Create second lock
  const lock2 = new MyLock(locker.createLock(key), 2)

  await lock1.lock() // Lock#1 has locked the key
  await lock2.lock() // Lock#2 has failed to lock the key, retry after 99 ms
  await sleep(200)
  console.log("Timeout 200 ms is up")
  await lock2.lock()   // Lock#2 has locked the key
  await lock1.lock()   // Lock#1 has failed to lock the key, retry after 98 ms
  await lock2.unlock() // Lock#2 has unlocked the key
  await lock1.lock()   // Lock#1 has locked the key
  await lock1.unlock() // Lock#1 has unlocked the key

  // Close Redis connection
  client.quit()
}

function sleep(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}
```