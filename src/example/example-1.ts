import { createClient } from 'redis'
import { createLocker, Locker, TTLError } from '..'

(async function main() {
  const client = createClient()
  const params = { ttl: 100 }
  const locker1 = createLocker(client, params)
  const locker2 = createLocker(client, params)
  const key = 'key'
  const lockUnlock = async (locker: Locker, id: number) => {
    try {
      const lock = await locker.lock(key)
      console.log('Locker#%d has locked the key', id)
      sleep(50)
      const { ok } = await lock.unlock()
      if (ok) {
        console.log('Locker#%d has unlocked the key', id)
      } else {
        console.log('Locker#%d has failed to unlock the key', id)
      }
    } catch (err) {
      if (err instanceof TTLError) {
        console.log('Locker#%d has failed to lock the key, retry after %d ms', id, err.ttl)
      } else {
        throw err
      }
    }
  }

  await Promise.all([lockUnlock(locker1, 1), lockUnlock(locker2, 2)])
  await Promise.all([lockUnlock(locker2, 2), lockUnlock(locker1, 1)])
  // Output:
  // Locker#1 has locked the key
  // Locker#2 has failed to lock the key, retry after 100 ms
  // Locker#1 has unlocked the key
  // Locker#2 has locked the key
  // Locker#1 has failed to lock the key, retry after 100 ms
  // Locker#2 has unlocked the key

  client.quit()
})()

function sleep(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}
