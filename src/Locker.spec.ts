import { createClient, RedisClient } from 'redis';
import { Locker } from './Locker';
import { Lock } from './Lock';

let client: RedisClient;
beforeAll(() => {
    client = createClient();
});
afterAll(() => {
    client.quit();
});

it('Locker', async () => {
    const locker = new Locker({ client, ttl: 100 });
    await expect(locker.lock('key')).resolves.toBeInstanceOf(Lock);
});
