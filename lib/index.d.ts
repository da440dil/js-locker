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
/** ErrInvalidTTL is the error message returned when LockerFactory constructor receives invalid value of ttl. */
export declare const ErrInvalidTTL = "ttl must be an integer greater than zero";
/** ErrInvalidRetryCount is the error message returned when LockerFactory constructor receives invalid value of retryCount. */
export declare const ErrInvalidRetryCount = "retryCount must be an integer greater than or equal to zero";
/** ErrInvalidRetryDelay is the error message returned when LockerFactory constructor receives invalid value of retryDelay. */
export declare const ErrInvalidRetryDelay = "retryDelay must be an integer greater than or equal to zero";
/** ErrInvalidRetryJitter is the error message returned when LockerFactory constructor receives invalid value of retryJitter. */
export declare const ErrInvalidRetryJitter = "retryJitter must be an integer greater than or equal to zero";
export declare type Params = {
    /** TTL of key in milliseconds (must be greater than 0). */
    ttl: number;
    /**
     * Maximum number of retries if key is locked
     * (must be greater than or equal to 0, by default equals 0).
     */
    retryCount?: number;
    /**
     * Delay in milliseconds between retries if key is locked
     * (must be greater than or equal to 0, by default equals 0).
     */
    retryDelay?: number;
    /**
     * Maximum time in milliseconds randomly added to delays between retries
     * to improve performance under high contention
     * (must be greater than or equal to 0, by default equals 0).
     */
    retryJitter?: number;
    /** Prefix of a key. */
    prefix?: string;
};
/**
 * LockerFactory defines parameters for creating new Locker.
 */
export declare class LockerFactory {
    private _storage;
    private _params;
    constructor(storage: Storage, { ttl, retryCount, retryDelay, retryJitter, prefix }: Params);
    /** Creates new Locker. */
    createLocker(key: string): Locker;
}
/**
 * Locker implements distributed locking.
 */
export declare class Locker {
    private _storage;
    private _ttl;
    private _retryCount;
    private _retryDelay;
    private _retryJitter;
    private _key;
    private _token;
    constructor(storage: Storage, { ttl, retryCount, retryDelay, retryJitter, prefix }: Required<Params>, key: string);
    /** Applies the lock, returns -1 on success, ttl in milliseconds on failure. */
    lock(): Promise<number>;
    /** Releases the lock, returns true on success. */
    unlock(): Promise<boolean>;
    private _create;
    private _insert;
    private _update;
}
