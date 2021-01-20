import { RedisClient } from 'redis';
import { RandomBytesFunc, createRandomBytes } from './random';
import { IResult, ILock, Lock } from './Lock';

/** Locker defines parameters for creating new lock. */
export class Locker {
    private client: RedisClient;
    private ttl: number;
    private createRandomBytes: RandomBytesFunc;
    private randomBytesSize: number;

    constructor({ client, ttl, randomBytesFunc = createRandomBytes, randomBytesSize = 16 }: {
        /** Redis [client](https://github.com/NodeRedis/node-redis). */
        client: RedisClient;
        /** TTL of a key in milliseconds. Must be greater than 0. */
        ttl: number;
        /**
         * Random generator to generate a lock token.
         * By default equals crypto.randomBytes.
         */
        randomBytesFunc?: RandomBytesFunc;
        /**
         * Bytes size to read from random generator to generate a lock token.
         * Must be greater than 0. By default equals 16.
         */
        randomBytesSize?: number;
    }) {
        this.client = client;
        this.ttl = ttl;
        this.createRandomBytes = randomBytesFunc;
        this.randomBytesSize = randomBytesSize;
    }

    /** Creates and applies new lock. */
    public async lock(key: string): Promise<ILockResult> {
        const buf = await this.createRandomBytes(this.randomBytesSize);
        const lock = new Lock({
            client: this.client,
            ttl: this.ttl,
            key,
            token: buf.toString('base64'),
        });
        const result = await lock.lock();
        return { lock, result };
    }
}

/** Contains new lock and result of applying the lock. */
export interface ILockResult {
    lock: ILock;
    result: IResult;
}
