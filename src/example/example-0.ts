import { createClient } from 'redis'
import { Locker, Lock, LockerError } from '../locker'
import { Storage } from '../redis'

(async function main() {
  const db = 10
  const ttl = 100
  const key = 'key'
  // Create Redis client
  const client = createClient({ db })
  // Create Redis storage
  const storage = new Storage(client)
  const params = { ttl }
  // Create locker
  const locker = new Locker(storage, params)

  let lock: Lock
  try {
    lock = await locker.lock(key)
    console.log('Locker has locked the key')
  } catch (err) {
    if (err instanceof LockerError) {
      console.log('Locker has failed to lock the key, retry after %d ms', err.ttl)
    }
    throw err
  }
  const ok = await lock.unlock()
  if (ok) {
    console.log('Locker has unlocked the key')
  } else {
    console.log('Locker has failed to unlock the key')
  }

  // Close Redis connection
  client.quit()
})()
