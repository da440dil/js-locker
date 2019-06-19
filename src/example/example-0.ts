import { createClient } from 'redis'
import Locker from '..'

(async function main() {
  const client = createClient()
  const ttl = 100
  const locker = Locker(client, { ttl })
  const key = 'key'

  let lock: Locker.Lock
  try {
    lock = await locker.lock(key)
    console.log('Locker has locked the key')
  } catch (err) {
    if (err instanceof Locker.Error) {
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

  client.quit()
})()
