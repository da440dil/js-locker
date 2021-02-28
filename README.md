# js-locker

[![Build Status](https://travis-ci.com/da440dil/js-locker.svg?branch=master)](https://travis-ci.com/da440dil/js-locker)
[![Coverage Status](https://coveralls.io/repos/github/da440dil/js-locker/badge.svg?branch=master)](https://coveralls.io/github/da440dil/js-locker?branch=master)

Distributed locking using [Redis](https://redis.io/).

[Example](./src/examples/example.ts) usage:

```typescript
import { promisify } from 'util';
import { createClient } from 'redis';
import { Locker } from '..';

const sleep = promisify(setTimeout);

async function main() {
    const client = createClient();
    const locker = new Locker({ client, ttl: 100 });

    const key = 'key';
    const lockUnlock = async (id: number) => {
        const { lock, result } = await locker.lock(key);
        if (!result.ok) {
            console.log('Failed to apply lock #%d, retry after %dms', id, result.ttl);
            return;
        }
        console.log('Lock #%d applied', id);
        await sleep(50);
        const res = await lock.lock();
        if (!res.ok) {
            console.log('Failed to extend lock #%d, retry after %dms', id, res.ttl);
            return;
        }
        console.log('Lock #%d extended', id);
        await sleep(50);
        const ok = await lock.unlock();
        if (!ok) {
            console.log('Failed to release lock #%d', id);
            return;
        }
        console.log('Lock #%d released', id);
    };

    await Promise.all([lockUnlock(1), lockUnlock(2)]);
    // Output:
    // Lock #1 applied
    // Failed to apply lock #2, retry after 100ms
    // Lock #1 extended
    // Lock #1 released

    client.quit();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
```
