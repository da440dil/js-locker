import { createClient } from 'redis'
import { createLocker, TTLError } from '..'

(async function main() {
  const client = createClient()
  const locker = createLocker(client, { ttl: 100 })
  const key = 'key'

  const lock = await locker.lock(key)
  console.log('Locker has locked the key')
  try {
    await locker.lock(key)
  } catch (err) {
    if (err instanceof TTLError) {
      console.log('Locker has failed to lock the key, retry after %d ms', err.ttl)
    } else {
      throw err
    }
  }
  const ok = await lock.unlock()
  if (ok) {
    console.log('Locker has unlocked the key')
  } else {
    console.log('Locker has failed to unlock the key')
  }

  client.quit()
})()
