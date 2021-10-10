import { IRedisClient } from '@da440dil/js-redis-script';
import { LockerScript } from './LockerScript';
import { Locker, ILocker } from './Locker';

export { ILockResult, Result } from './LockResult';
export { ILocker };

/** Creates new locker. */
export const createLocker = ({ client, ttl }: {
	/** Redis client: [node-redis](https://github.com/NodeRedis/node-redis) or [ioredis](https://github.com/luin/ioredis). */
	client: IRedisClient;
	/** TTL of a key in milliseconds. Must be greater than 0. */
	ttl: number;
}): ILocker => {
	return new Locker(new LockerScript(client, ttl));
};
