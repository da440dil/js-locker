import { RedisClient } from 'redis'
import { Gateway } from './redis'
import { Locker, Lock, LockerError, Params } from './locker'

export { Gateway, Locker, Lock, LockerError }

/**
 * Creates new Locker.
 * @param client Redis client.
 * @param params Locker params.
 */
export default function createLocker(client: RedisClient, params: Params): Locker {
  return new Locker(new Gateway(client), params)
}

createLocker.Locker = Locker
createLocker.Lock = Lock
createLocker.Error = LockerError
