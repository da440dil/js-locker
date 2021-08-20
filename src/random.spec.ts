import { createRandomBytes } from './random';
import * as crypto from 'crypto';

jest.mock('crypto');

afterAll(() => {
	jest.unmock('crypto');
});

it('random', async () => {
	const bytesSize = 16;
	const token = 'token';

	const randomBytes = jest.spyOn(crypto, 'randomBytes');

	randomBytes.mockImplementation((_, cb) => {
		cb(null, Buffer.from(token));
	});
	await expect(createRandomBytes(bytesSize)).resolves.toEqual(Buffer.from(token));

	const err = new Error('Crypto error');
	randomBytes.mockImplementation((_, cb) => {
		cb(err, Buffer.alloc(0));
	});

	await expect(createRandomBytes(bytesSize)).rejects.toThrow(err);

	randomBytes.mockRestore();
});
