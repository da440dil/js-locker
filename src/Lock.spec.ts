import { promisify } from 'util';
import { createClient, RedisClient } from 'redis';
import { RedisScript } from '@da440dil/js-redis-script';
import { Lock, locksrc, unlocksrc } from './Lock';

const sleep = promisify(setTimeout);

const key = 'key';

let client: RedisClient;
let lockScript: RedisScript<number>;
let unlockScript: RedisScript<number>;
beforeAll(() => {
	client = createClient();
	lockScript = new RedisScript({ client, src: locksrc, keysNum: 1 });
	unlockScript = new RedisScript({ client, src: unlocksrc, keysNum: 1 });
});
afterAll(() => {
	client.quit();
});
beforeEach((cb) => {
	client.del(key, cb);
});

it('Lock', async () => {
	const ttl = 500;

	const lock1 = new Lock(lockScript, unlockScript, ttl, key, 'token1');
	let result = await lock1.lock();
	expect(result.ok).toEqual(true);
	expect(result.ttl).toEqual(-3);

	result = await lock1.lock();
	expect(result.ok).toEqual(true);
	expect(result.ttl).toEqual(-4);

	const lock2 = new Lock(lockScript, unlockScript, ttl, key, 'token2');
	result = await lock2.lock();
	expect(result.ok).toEqual(false);
	expect(result.ttl).toBeGreaterThanOrEqual(0);
	expect(result.ttl).toBeLessThanOrEqual(ttl);

	await sleep(result.ttl + 100); // wait for the ttl of the key is over

	result = await lock2.lock();
	expect(result.ok).toEqual(true);
	expect(result.ttl).toEqual(-3);

	let ok = await lock1.unlock();
	expect(ok).toEqual(false);

	ok = await lock2.unlock();
	expect(ok).toEqual(true);
});
