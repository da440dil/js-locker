import { RedisClient } from 'redis';
import { Locker } from './Locker';
import { Lock } from './Lock';

const runMock = jest.fn();
jest.mock('js-redis-script', () => {
    return {
        RedisScript: jest.fn().mockImplementation(() => {
            return { run: runMock };
        }),
    };
});

it('Locker', async () => {
    const locker = new Locker({ client: {} as RedisClient, ttl: 100 });

    runMock.mockImplementation(() => Promise.resolve(-3));
    const { lock, result } = await locker.lock('');
    expect(lock).toBeInstanceOf(Lock);
    expect(result).toMatchObject({ ok: true, ttl: -3 });
});
