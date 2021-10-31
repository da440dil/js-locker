# js-locker

[![Build Status](https://travis-ci.com/da440dil/js-locker.svg?branch=master)](https://travis-ci.com/da440dil/js-locker)
[![Coverage Status](https://coveralls.io/repos/github/da440dil/js-locker/badge.svg?branch=master)](https://coveralls.io/github/da440dil/js-locker?branch=master)

Distributed locking using [Redis](https://redis.io/).

[Example](./examples/example.ts) usage:

```typescript
import { createClient } from 'redis';
import { createLocker } from '@da440dil/js-locker';

async function main() {
	const client = createClient();
	// Create new locker.
	const locker = createLocker(client);

	// Try to apply lock.
	const lock = await locker.lock('some-key', 1000);
	if (!lock.ok) {
		console.log('Failed to apply lock, retry after %dms', lock.ttl);
		return client.quit();
	}
	console.log('Lock applied');

	// some code here

	// Optionally try to extend lock.
	const result = await lock.lock(1000);
	if (!result.ok) {
		console.log('Failed to extend lock, retry after %dms', result.ttl);
		return client.quit();
	}
	console.log('Lock extended');

	// Try to release lock.
	const ok = await lock.unlock();
	if (!ok) {
		console.log('Failed to release lock');
		return client.quit();
	}
	console.log('Lock released');

	return client.quit();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
```

```
npm run file examples/example.ts
```

[Benchmarks](./benchmarks)
```
npm run file benchmarks/benchmark.ts
```
