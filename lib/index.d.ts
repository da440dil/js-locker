/**
 * Locker defines parameters for creating new Lock.
 */
export interface Locker {
    createLock(key: string): Lock;
}
/**
 * Lock implements distributed locking.
 */
export interface Lock {
    /** Applies the lock, returns -1 on success, ttl in milliseconds on failure. */
    lock(): Promise<number>;
    /** Releases the lock, returns true on success. */
    unlock(): Promise<boolean>;
}
/**
 * Storage imlements key value storage.
 */
export interface Storage {
    /**
     * Sets key value and ttl of key if key value not exists,
     * returns -1 on success, ttl in milliseconds on failure.
     */
    insert(key: string, value: string, ttl: number): Promise<number>;
    /**
     * Sets key value and ttl of key if key value not exists,
     * updates ttl of key if key value equals value,
     * returns -1 on success, ttl in milliseconds on failure.
     */
    upsert(key: string, value: string, ttl: number): Promise<number>;
    /**
     * Deletes key if key value exists,
     * returns true on success.
     */
    remove(key: string, value: string): Promise<boolean>;
}
/**
 * Params defines parameters for creating new Locker.
 */
export declare type Params = {
    /** TTL of key. */
    ttl: number;
    /** Maximum number of retries if key is locked. */
    retryCount?: number;
    /** Delay between retries if key is locked. */
    retryDelay?: number;
    /** Prefix of key. */
    prefix?: string;
};
/**
 * Creates new Locker.
 */
export declare function createLocker(storage: Storage, params: Params): Locker;
