import { IRedisClient } from '@da440dil/js-redis-script';
import { RandomBytesFunc, createRandomBytes } from './random';
import { LockerScript } from './LockerScript';
import { IResult, ILock, Lock } from './Lock';

/** Locker defines parameters for creating new lock. */
export class Locker implements ILocker {
	private locker: LockerScript;
	private createRandomBytes: RandomBytesFunc;
	private randomBytesSize: number;

	constructor({ client, ttl, randomBytesFunc = createRandomBytes, randomBytesSize = 16 }: {
		/** Redis client: [node-redis](https://github.com/NodeRedis/node-redis) or [ioredis](https://github.com/luin/ioredis). */
		client: IRedisClient;
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
		this.locker = new LockerScript(client, ttl);
		this.createRandomBytes = randomBytesFunc;
		this.randomBytesSize = randomBytesSize;
	}

	/** Creates and applies new lock. */
	public async lock(key: string): Promise<ILockResult> {
		const buf = await this.createRandomBytes(this.randomBytesSize);
		const lock = new Lock(this.locker, key, buf.toString('base64'));
		const result = await lock.lock();
		return { lock, result };
	}
}

export interface ILocker {
	lock(key: string): Promise<ILockResult>;
}

/** Contains new lock and result of applying the lock. */
export interface ILockResult {
	lock: ILock;
	result: IResult;
}
