/**
 * Storage implements storage in memory.
 */
export interface Storage {
    insert(key: string, value: string, ttl: number): Promise<number>;
    upsert(key: string, value: string, ttl: number): Promise<number>;
    remove(key: string, value: string): Promise<boolean>;
    /** Stops refresh cycle. */
    quit(): void;
}
/**
 * Creates new Storage.
 * @param refreshInterval Interval to remove stale keys in milliseconds.
 */
export declare function createStorage(refreshInterval: number): Storage;
