import { Storage } from '../.';
import { RedisClient } from 'redis';
/**
 * ErrInvalidResponse is the error message returned when Redis command returns response of invalid type.
 */
export declare const ErrInvalidResponse = "Invalid response";
/**
 * ErrKeyNameClash is the error message returned when Redis key exists and has no TTL.
 */
export declare const ErrKeyNameClash = "Key name clash";
export { Storage };
/**
 * Creates new Storage.
 * @param client
 */
export declare function createStorage(client: RedisClient): Storage;
