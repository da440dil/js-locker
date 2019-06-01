/**
 * Storage to store a lock state.
 */
export interface Storage {
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
/** Error message returned when Locker constructor receives invalid value of ttl. */
export declare const ErrInvalidTTL = "ttl must be an integer greater than zero";
/** Error message returned when Locker constructor receives invalid value of retryCount. */
export declare const ErrInvalidRetryCount = "retryCount must be an integer greater than or equal to zero";
/** Error message returned when Locker constructor receives invalid value of retryDelay. */
export declare const ErrInvalidRetryDelay = "retryDelay must be an integer greater than or equal to zero";
/** Error message returned when Locker constructor receives invalid value of retryJitter. */
export declare const ErrInvalidRetryJitter = "retryJitter must be an integer greater than or equal to zero";
/** Error message returned when lock failed. */
export declare const ErrConflict = "Conflict";
/**
 * Error returned when lock failed.
 */
export declare class LockerError extends Error {
    private _ttl;
    constructor(ttl: number);
    readonly ttl: number;
}
/** Parameters for creating new Lock */
export interface Params {
    /**
     * TTL of key in milliseconds.
     * Must be greater than 0.
     */
    ttl: number;
    /**
     * Maximum number of retries if key is locked.
     * Must be greater than or equal to 0, by default equals 0.
     */
    retryCount?: number;
    /**
     * Delay in milliseconds between retries if key is locked.
     * Must be greater than or equal to 0, by default equals 0.
     */
    retryDelay?: number;
    /**
     * Maximum time in milliseconds randomly added to delays between retries to improve performance under high contention.
     * Must be greater than or equal to 0, by default equals 0.
     */
    retryJitter?: number;
    /** Prefix of a key. */
    prefix?: string;
}
/**
 * Locker defines parameters for creating new Lock.
 */
export declare class Locker {
    private _storage;
    private _params;
    constructor(storage: Storage, { ttl, retryCount, retryDelay, retryJitter, prefix }: Params);
    /** Creates new Lock. */
    createLock(key: string): Lock;
    /** Applies the lock. */
    lock(key: string): Promise<Lock>;
}
/**
 * Lock implements distributed locking.
 */
export declare class Lock {
    private _storage;
    private _ttl;
    private _retryCount;
    private _retryDelay;
    private _retryJitter;
    private _key;
    private _token;
    constructor(storage: Storage, { ttl, retryCount, retryDelay, retryJitter, prefix }: Required<Params>, key: string);
    /** Applies the lock. Returns -1 on success, ttl in milliseconds on failure. */
    lock(): Promise<number>;
    /** Releases the lock. Returns true on success, false on failure. */
    unlock(): Promise<boolean>;
    private _create;
    private _insert;
    private _update;
}
