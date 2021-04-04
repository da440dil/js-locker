import { createRandomBytes } from './random';
import * as crypto from 'crypto';

jest.mock('crypto');

afterAll(() => {
	jest.unmock('crypto');
});

it('random', async () => {
	const bytesSize = 16;
	const token = 'token';

	const rndMock = jest.spyOn(crypto, 'randomBytes');

	rndMock.mockImplementation((_, cb) => {
		cb(null, Buffer.from(token));
	});
	await expect(createRandomBytes(bytesSize)).resolves.toEqual(Buffer.from(token));

	const err = new Error('Crypto error');
	rndMock.mockImplementation((_, cb) => {
		cb(err, Buffer.alloc(0));
	});

	await expect(createRandomBytes(bytesSize)).rejects.toThrow(err);

	rndMock.mockRestore();
});
