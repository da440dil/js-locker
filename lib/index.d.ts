/** ErrInvalidTTL is the error message returned when createCounter receives invalid value of ttl. */
export declare const ErrInvalidTTL = "ttl must be an integer greater than zero";
export declare const ErrInvalidRetryCount = "retryCount must be an integer greater than or equal to zero";
export declare const ErrInvalidRetryDelay = "retryDelay must be an integer greater than or equal to zero";
export declare const ErrInvalidRetryJitter = "retryJitter must be an integer greater than or equal to zero";
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
 * Creates new Locker.
 */
export declare function createLocker(storage: Storage, { ttl, retryCount, retryDelay, retryJitter, prefix }: {
    /** TTL of key in milliseconds (must be greater than 0). */
    ttl: number;
    /** Maximum number of retries if key is locked
     * (must be greater than or equal to 0, by default equals 0).
     */
    retryCount?: number;
    /** Delay in milliseconds between retries if key is locked
     * (must be greater than or equal to 0, by default equals 0).
     */
    retryDelay?: number;
    /** Maximum time in milliseconds randomly added to delays between retries
     * to improve performance under high contention
     * (must be greater than or equal to 0, by default equals 0).
     */
    retryJitter?: number;
    /** Prefix of a key. */
    prefix?: string;
}): Locker;
