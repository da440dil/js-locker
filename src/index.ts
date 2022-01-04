import { IRedisClient, INodeRedisClient } from '@da440dil/js-redis-script';
import { LockerScript } from './LockerScript';
import { Locker, ILocker } from './Locker';

export { ILockResult, Result } from './LockResult';
export { IRedisClient, INodeRedisClient, ILocker };

/**
 * Creates new locker.
 * @param client Minimal Redis client interface: [node-redis](https://github.com/NodeRedis/node-redis) v3 or v4 or [ioredis](https://github.com/luin/ioredis) v4.
 */
export const createLocker = (client: IRedisClient | INodeRedisClient): ILocker => {
	return new Locker(new LockerScript(client));
};
