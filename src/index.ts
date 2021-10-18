import { IRedisClient } from '@da440dil/js-redis-script';
import { LockerScript } from './LockerScript';
import { Locker, ILocker } from './Locker';

export { ILockResult, Result } from './LockResult';
export { ILocker };

/**
 * Creates new locker.
 * @param client Minimal Redis client interface: [node-redis](https://github.com/NodeRedis/node-redis) and [ioredis](https://github.com/luin/ioredis) both implement it.
 */
export const createLocker = (client: IRedisClient): ILocker => {
	return new Locker(new LockerScript(client));
};
