# js-locker

[![Build Status](https://travis-ci.com/da440dil/js-locker.svg?branch=master)](https://travis-ci.com/da440dil/js-locker)
[![Coverage Status](https://coveralls.io/repos/github/da440dil/js-locker/badge.svg?branch=master)](https://coveralls.io/github/da440dil/js-locker?branch=master)

Distributed locking using [Redis](https://redis.io/).

[Example](./src/examples/example.ts) usage:

```typescript
import { promisify } from 'util';
import { createClient } from 'redis';
import { createLocker } from '..';

const sleep = promisify(setTimeout);

async function main() {
	const client = createClient();
	const locker = createLocker({ client, ttl: 100 });

	const key = 'key';
	const lockUnlock = async (id: number) => {
		const lockResult = await locker.lock(key);
		if (!lockResult.ok) {
			console.log('Failed to apply lock #%d, retry after %dms', id, lockResult.ttl);
			return;
		}
		console.log('Lock #%d applied', id);
		await sleep(50);
		const result = await lockResult.lock();
		if (!result.ok) {
			console.log('Failed to extend lock #%d, retry after %dms', id, result.ttl);
			return;
		}
		console.log('Lock #%d extended', id);
		await sleep(50);
		const ok = await lockResult.unlock();
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

```
npm run file src/examples/example.ts
```

[Benchmarks](./src/benchmarks)
```
npm run file src/benchmarks/benchmark.ts
```
