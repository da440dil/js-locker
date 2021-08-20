import { LockerScript } from './LockerScript';
import { Locker } from './Locker';
import { Lock } from './Lock';

const lock = jest.fn();
const randomBytesFunc = jest.fn(() => Promise.resolve(Buffer.from('qwerty')));
const randomBytesSize = 16;

it('Locker', async () => {
	const locker = new Locker({ lock } as unknown as LockerScript, randomBytesFunc, randomBytesSize);

	lock.mockImplementation(() => Promise.resolve(-3));
	let result = await locker.lock('');
	expect(result.lock).toBeInstanceOf(Lock);
	expect(result.result).toEqual({ ok: true, ttl: -3 });

	lock.mockImplementation(() => Promise.resolve(42));
	result = await locker.lock('');
	expect(result.lock).toBeInstanceOf(Lock);
	expect(result.result).toEqual({ ok: false, ttl: 42 });
});
