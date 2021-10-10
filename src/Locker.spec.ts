import crypto from 'crypto';
import { LockerScript } from './LockerScript';
import { Locker } from './Locker';

afterAll(() => {
	jest.restoreAllMocks();
});

const randomBytes = jest.spyOn(crypto, 'randomBytes');
const lock = jest.fn();
const locker = new Locker({ lock } as unknown as LockerScript);

it('should create lock', async () => {
	randomBytes.mockImplementation((_, cb) => {
		cb(null, Buffer.from('qwerty'));
	});

	lock.mockImplementation(() => Promise.resolve(42));
	const result = await locker.lock('');
	expect(result.ok).toBe(false);
	expect(result.ttl).toEqual(42);
});

it('should throw error if crypto.randomBytes throws error', async () => {
	const err = new Error('Crypto error');
	randomBytes.mockImplementation((_, cb) => {
		cb(err, Buffer.alloc(0));
	});

	await expect(locker.lock('')).rejects.toThrow(err);
});
