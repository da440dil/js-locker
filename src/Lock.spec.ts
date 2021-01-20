import { createClient, RedisClient } from 'redis';
import { Lock, errUnexpectedRedisResponse } from './Lock';
import { sleep } from './sleep';
import { mockCallback } from './mock';

const key = 'key';

let client: RedisClient;
beforeAll(() => {
    client = createClient();
});
afterAll(() => {
    client.quit();
});
beforeEach((cb) => {
    client.del(key, cb);
});

it('Lock', async () => {
    const ttl = 500;

    const lock1 = new Lock({ client, ttl, key, token: 'token1' });
    let result = await lock1.lock();
    expect(result.ok).toEqual(true);
    expect(result.ttl).toEqual(-3);

    result = await lock1.lock();
    expect(result.ok).toEqual(true);
    expect(result.ttl).toEqual(-4);

    const lock2 = new Lock({ client, ttl, key, token: 'token2' });
    result = await lock2.lock();
    expect(result.ok).toEqual(false);
    expect(result.ttl).toBeGreaterThanOrEqual(0);
    expect(result.ttl).toBeLessThanOrEqual(ttl);

    await sleep(result.ttl); // wait for the ttl of the key is over

    result = await lock2.lock();
    expect(result.ok).toEqual(true);
    expect(result.ttl).toEqual(-3);

    let ok = await lock1.unlock();
    expect(ok).toEqual(false);

    ok = await lock2.unlock();
    expect(ok).toEqual(true);

    const redisErr = new Error('Redis error');
    const resErr = new Error(errUnexpectedRedisResponse);

    const evalMock = jest.spyOn(client, 'evalsha');

    evalMock.mockImplementation(mockCallback(redisErr, -3));
    await expect(lock1.lock()).rejects.toThrow(redisErr);
    await expect(lock1.unlock()).rejects.toThrow(redisErr);

    evalMock.mockImplementation(mockCallback(null, undefined));
    await expect(lock1.lock()).rejects.toThrow(resErr);
    await expect(lock1.unlock()).rejects.toThrow(resErr);

    evalMock.mockImplementation(mockCallback(null, 1));
    await expect(lock1.lock()).resolves.toMatchObject({ ok: false, ttl: 1 });

    evalMock.mockImplementation(mockCallback(null, -2));
    await expect(lock1.lock()).resolves.toMatchObject({ ok: false, ttl: -2 });

    evalMock.mockImplementation(mockCallback(null, -3));
    await expect(lock1.lock()).resolves.toMatchObject({ ok: true, ttl: -3 });

    evalMock.mockImplementation(mockCallback(null, 0));
    await expect(lock1.unlock()).resolves.toEqual(false);

    evalMock.mockImplementation(mockCallback(null, 1));
    await expect(lock1.unlock()).resolves.toEqual(true);

    const redisLoadErr = new Error('NOSCRIPT No matching script. Please use EVAL.');

    const loadMock = jest.spyOn(client, 'script');
    loadMock.mockImplementation(mockCallback(redisErr, undefined));
    evalMock.mockImplementation(mockCallback(redisLoadErr, -3));
    await expect(lock1.lock()).rejects.toThrow(redisErr);
    await expect(lock1.unlock()).rejects.toThrow(redisErr);

    loadMock.mockImplementation(mockCallback(null, undefined));
    evalMock.mockImplementationOnce(mockCallback(redisLoadErr, -3)).mockImplementationOnce(mockCallback(null, -3));
    await expect(lock1.lock()).resolves.toMatchObject({ ok: true, ttl: -3 });

    evalMock.mockImplementationOnce(mockCallback(redisLoadErr, 1)).mockImplementationOnce(mockCallback(null, 1));
    await expect(lock1.unlock()).resolves.toEqual(true);

    loadMock.mockRestore();
    evalMock.mockRestore();
});
