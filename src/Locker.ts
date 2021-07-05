import { RedisClient } from 'redis';
import { RedisScript } from '@da440dil/js-redis-script';
import { RandomBytesFunc, createRandomBytes } from './random';
import { IResult, ILock, Lock, locksrc, unlocksrc } from './Lock';



/** Locker defines parameters for creating new lock. */
export class Locker {
	private lockScript: RedisScript<number>;
	private unlockScript: RedisScript<number>;
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
		this.lockScript = new RedisScript({ client, src: locksrc, keysNum: 1 });
		this.unlockScript = new RedisScript({ client, src: unlocksrc, keysNum: 1 });
		this.ttl = ttl;
		this.createRandomBytes = randomBytesFunc;
		this.randomBytesSize = randomBytesSize;
	}

	/** Creates and applies new lock. */
	public async lock(key: string): Promise<ILockResult> {
		const buf = await this.createRandomBytes(this.randomBytesSize);
		const lock = new Lock(
			this.lockScript,
			this.unlockScript,
			this.ttl,
			key,
			buf.toString('base64'),
		);
		const result = await lock.lock();
		return { lock, result };
	}
}

/** Contains new lock and result of applying the lock. */
export interface ILockResult {
	lock: ILock;
	result: IResult;
}
