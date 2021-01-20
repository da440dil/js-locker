import { createClient, RedisClient } from 'redis';
import { Locker } from './Locker';
import { Lock } from './Lock';
import { mockCallback } from './mock';

let client: RedisClient;
beforeAll(() => {
    client = createClient();
});
afterAll(() => {
    client.quit();
});

it('Locker', async () => {
    const evalMock = jest.spyOn(client, 'evalsha');
    evalMock.mockImplementation(mockCallback(null, -3));

    const locker = new Locker({ client, ttl: 100 });
    const { lock, result } = await locker.lock('key');
    expect(lock).toBeInstanceOf(Lock);
    expect(result).toMatchObject({ ok: true, ttl: -3 });

    evalMock.mockRestore();
});
