# js-locker

[![Build Status](https://travis-ci.com/da440dil/js-locker.svg?branch=master)](https://travis-ci.com/da440dil/js-locker)
[![Coverage Status](https://coveralls.io/repos/github/da440dil/js-locker/badge.svg?branch=master)](https://coveralls.io/github/da440dil/js-locker?branch=master)

Distributed locking using [Redis](https://redis.io/).

## Example

```javascript
import { createClient } from 'redis'
import { createLocker, TTLError } from '@da440dil/js-locker'

(async function main() {
  const client = createClient()
  const locker = createLocker(client, { ttl: 100 })
  const key = 'key'
  const lockUnlock = async () => {
    try {
      const lock = await locker.lock(key)
      console.log('Locker has locked the key')
      sleep(50)
      const { ok } = await lock.unlock()
      if (ok) {
        console.log('Locker has unlocked the key')
      } else {
        console.log('Locker has failed to unlock the key')
      }
    } catch (err) {
      if (err instanceof TTLError) {
        console.log('Locker has failed to lock the key, retry after %d ms', err.ttl)
      } else {
        throw err
      }
    }
  }

  await Promise.all([lockUnlock(), lockUnlock()])
  // Output:
  // Locker has locked the key
  // Locker has failed to lock the key, retry after 100 ms
  // Locker has unlocked the key

  client.quit()
})()

function sleep(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}
```