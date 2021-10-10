import { IRedisClient } from '@da440dil/js-redis-script';
import { LockerScript } from './LockerScript';
import { Locker, ILocker } from './Locker';

export { ILockResult, Result } from './LockResult';
export { ILocker };

/**
 * Creates new locker.
 * @param {IRedisClient} client Redis client: [node-redis](https://github.com/NodeRedis/node-redis) or [ioredis](https://github.com/luin/ioredis).
 */
export const createLocker = (client: IRedisClient): ILocker => {
	return new Locker(new LockerScript(client));
};
