import { IRedisClient } from '@da440dil/js-redis-script';
import { Locker } from './Locker';
import { Lock } from './Lock';

const run = jest.fn();
jest.mock('@da440dil/js-redis-script', () => {
	return {
		createScript: jest.fn().mockImplementation(() => {
			return { run };
		})
	};
});

afterAll(() => {
	jest.unmock('@da440dil/js-redis-script');
});

it('Locker', async () => {
	const locker = new Locker({ client: {} as IRedisClient, ttl: 100 });

	run.mockImplementation(() => Promise.resolve(-3));
	let result = await locker.lock('');
	expect(result.lock).toBeInstanceOf(Lock);
	expect(result.result).toEqual({ ok: true, ttl: -3 });

	run.mockImplementation(() => Promise.resolve(42));
	result = await locker.lock('');
	expect(result.lock).toBeInstanceOf(Lock);
	expect(result.result).toEqual({ ok: false, ttl: 42 });
});
