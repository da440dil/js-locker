import { createClient, RedisClient, Callback } from 'redis';
import { Lock, errMsgInvalidResponse } from './Lock';
import { sleep } from './sleep';

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
    const resErr = new Error(errMsgInvalidResponse);

    const evalMock = jest.spyOn(client, 'evalsha');

    evalMock.mockImplementation(makeEvalFn(redisErr, -3));
    await expect(lock1.lock()).rejects.toThrow(redisErr);
    await expect(lock1.unlock()).rejects.toThrow(redisErr);

    evalMock.mockImplementation(makeEvalFn(null, undefined));
    await expect(lock1.lock()).rejects.toThrow(resErr);
    await expect(lock1.unlock()).rejects.toThrow(resErr);

    evalMock.mockImplementation(makeEvalFn(null, 1));
    await expect(lock1.lock()).resolves.toMatchObject({ ok: false, ttl: 1 });

    evalMock.mockImplementation(makeEvalFn(null, -2));
    await expect(lock1.lock()).resolves.toMatchObject({ ok: false, ttl: -2 });

    evalMock.mockImplementation(makeEvalFn(null, -3));
    await expect(lock1.lock()).resolves.toMatchObject({ ok: true, ttl: -3 });

    evalMock.mockImplementation(makeEvalFn(null, 0));
    await expect(lock1.unlock()).resolves.toEqual(false);

    evalMock.mockImplementation(makeEvalFn(null, 1));
    await expect(lock1.unlock()).resolves.toEqual(true);

    const redisLoadErr = new Error('NOSCRIPT No matching script. Please use EVAL.');

    const loadMock = jest.spyOn(client, 'script');
    loadMock.mockImplementation(makeEvalFn(redisErr, undefined));
    evalMock.mockImplementation(makeEvalFn(redisLoadErr, -3));
    await expect(lock1.lock()).rejects.toThrow(redisErr);
    await expect(lock1.unlock()).rejects.toThrow(redisErr);

    loadMock.mockImplementation(makeEvalFn(null, undefined));
    evalMock.mockImplementationOnce(makeEvalFn(redisLoadErr, -3)).mockImplementationOnce(makeEvalFn(null, -3));
    await expect(lock1.lock()).resolves.toMatchObject({ ok: true, ttl: -3 });

    evalMock.mockImplementationOnce(makeEvalFn(redisLoadErr, 1)).mockImplementationOnce(makeEvalFn(null, 1));
    await expect(lock1.unlock()).resolves.toEqual(true);

    loadMock.mockRestore();
    evalMock.mockRestore();
});

type Res = number | undefined;

function makeEvalFn(err: Error | null, res: Res) {
    return (...args: (string | number | Callback<Res>)[]): boolean => {
        const cb = args[args.length - 1];
        if (typeof cb === 'function') {
            cb(err, res);
        }
        return false;
    };
}
