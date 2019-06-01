import { RedisClient } from 'redis';
/**
 * Error message returned when Redis command returns response of invalid type.
 */
export declare const ErrInvalidResponse = "Invalid response";
/**
 * Error message returned when Redis key exists and has no TTL.
 */
export declare const ErrKeyNameClash = "Key name clash";
/** Implements Locker#Storage */
export declare class Storage {
    private _client;
    constructor(client: RedisClient);
    /**
     * Inserts key value and ttl of key if key value not exists.
     * Returns -1 on success, ttl in milliseconds on failure.
     */
    insert(key: string, value: string, ttl: number): Promise<number>;
    /**
     * Inserts key value and ttl of key if key value not exists.
     * Updates ttl of key if key value equals input value.
     * Returns -1 on success, ttl in milliseconds on failure.
     */
    upsert(key: string, value: string, ttl: number): Promise<number>;
    /**
     * Removes key if key value equals input value.
     * Returns true on success, false on failure.
     */
    remove(key: string, value: string): Promise<boolean>;
}
