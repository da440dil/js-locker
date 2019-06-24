import { RedisClient } from 'redis'
import { Gateway as RedisGateway } from './redis'
import { Gateway, Params, Locker, Lock, TTLError } from './locker'

export { Gateway, Params, Locker, Lock, TTLError }

/**
 * Creates new Locker.
 * @param client Redis client.
 * @param params Locker params.
 */
export function createLocker(client: RedisClient, params: Params): Locker {
  return new Locker(new RedisGateway(client), params)
}
