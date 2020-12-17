import { createClient } from 'redis';
import { Locker } from '..';
import { sleep } from '../sleep';

async function main() {
    const client = createClient();
    const locker = new Locker({ client, ttl: 100 });

    const key = 'key';
    const lockUnlock = async (id: number) => {
        const lock = await locker.lock(key);
        const result = await lock.lock();
        if (!result.ok) {
            console.log('Failed to apply lock #%d, retry after %dms', id, result.ttl);
            return;
        }
        console.log('Lock #%d applied', id);
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
    // Lock #1 released

    client.quit();
}

main().catch((err) => { throw err; });
