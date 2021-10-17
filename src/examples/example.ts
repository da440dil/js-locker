import { createClient } from 'redis';
import { createLocker } from '..';

async function main() {
	const client = createClient();
	// Create new locker.
	const locker = createLocker(client);

	// Try to apply lock.
	const lock = await locker.lock('some-key', 1000);
	if (!lock.ok) {
		console.log('Failed to apply lock, retry after %dms', lock.ttl);
		return;
	}
	console.log('Lock applied');

	// some code here

	// Optionally try to extend lock.
	const result = await lock.lock(1000);
	if (!result.ok) {
		console.log('Failed to extend lock, retry after %dms', result.ttl);
		return;
	}
	console.log('Lock extended');

	// Try to release lock.
	const ok = await lock.unlock();
	if (!ok) {
		console.log('Failed to release lock');
		return;
	}
	console.log('Lock released');

	client.quit();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
