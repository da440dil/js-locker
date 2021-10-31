import { hrtime } from 'process';
import { createClient, RedisClient } from 'redis';
import { createLocker } from '../src';

async function main() {
	const client = createClient();
	await app(client);
	client.quit();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});

async function app(client: RedisClient): Promise<void> {
	await flushdb(client);

	const ttl = 60000;
	const locker = createLocker(client);

	const prefix = 'test';
	const batchSize = parseInt(process.env.BENCHMARK_SIZE || '10000', 10);
	const keys = Array.from({ length: batchSize }, (_, i) => `${prefix}:${i}`);

	const lockerLockStart = hrtime.bigint();
	const locks = await Promise.all(keys.map((key) => locker.lock(key, ttl)));
	const lockerLockEnd = hrtime.bigint();
	const lockerLockTime = toMs(lockerLockStart, lockerLockEnd);

	const lockStart = hrtime.bigint();
	await Promise.all(locks.map((lock) => lock.lock(ttl)));
	const lockEnd = hrtime.bigint();
	const lockTime = toMs(lockStart, lockEnd);

	const unlockStart = hrtime.bigint();
	await Promise.all(locks.map((lock) => lock.unlock()));
	const unlockEnd = hrtime.bigint();
	const unlockTime = toMs(unlockStart, unlockEnd);

	console.table({
		'Locker.Lock': {
			'Total (req)': batchSize,
			'Total (ms)': lockerLockTime,
			'Avg (req/sec)': toReqPerSec(batchSize, lockerLockTime)
		},
		'Lock.Lock': {
			'Total (req)': batchSize,
			'Total (ms)': lockTime,
			'Avg (req/sec)': toReqPerSec(batchSize, lockTime)
		},
		'Lock.Unlock': {
			'Total (req)': batchSize,
			'Total (ms)': unlockTime,
			'Avg (req/sec)': toReqPerSec(batchSize, unlockTime)
		}
	});

	await flushdb(client);
}

function flushdb(client: RedisClient): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		client.flushdb((err) => {
			if (err) {
				return reject(err);
			}
			resolve();
		});
	});
}

function toMs(start: bigint, end: bigint): number {
	return Math.round(Number(end - start) * 1e-6 * 100) / 100;
}

function toReqPerSec(batchSize: number, timeMs: number): number {
	return Math.round(((batchSize * 1000) / timeMs) * 100) / 100;
}
