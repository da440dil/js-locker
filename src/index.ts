import { IRedisClient } from '@da440dil/js-redis-script';
import { LockerScript } from './LockerScript';
import { RandomBytesFunc, createRandomBytes } from './random';
import { Locker, ILocker, ILockResult } from './Locker';

export { ILock, IResult } from './Lock';
export { ILocker, ILockResult };

/** Creates new locker. */
export const createLocker = ({ client, ttl, randomBytesFunc = createRandomBytes, randomBytesSize = 16 }: {
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
}): ILocker => {
	return new Locker(new LockerScript(client, ttl), randomBytesFunc, randomBytesSize);
};
