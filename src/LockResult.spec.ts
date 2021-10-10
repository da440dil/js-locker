import { LockResult } from './LockResult';

const lock = jest.fn();
const unlock = jest.fn();

const result = new LockResult({ lock, unlock }, { ok: true, ttl: 42 });

it('should lock & unlock & contain result', async () => {
	await result.lock();
	await result.unlock();

	expect(unlock.mock.calls).toEqual([[]]);
	expect(lock.mock.calls).toEqual([[]]);
	expect(result.ok).toBe(true);
	expect(result.ttl).toBe(42);
});
