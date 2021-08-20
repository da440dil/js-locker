import { promisify } from 'util';
import { createClient, RedisClient } from 'redis';
import { LockerScript } from './LockerScript';
import { Lock } from './Lock';

const sleep = promisify(setTimeout);

const ttl = 500;
const key = 'key';

let client: RedisClient;
let locker: LockerScript;
beforeAll(() => {
	client = createClient();
	locker = new LockerScript(client, ttl);
});
afterAll(() => {
	client.quit();
});
beforeEach((cb) => {
	client.del(key, cb);
});

it('Lock', async () => {
	const lock1 = new Lock(locker, key, 'token1');
	let result = await lock1.lock();
	expect(result.ok).toEqual(true);
	expect(result.ttl).toEqual(-3);

	result = await lock1.lock();
	expect(result.ok).toEqual(true);
	expect(result.ttl).toEqual(-4);

	const lock2 = new Lock(locker, key, 'token2');
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
