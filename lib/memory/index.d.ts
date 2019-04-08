import { Storage as S } from '../.';
/**
 * Storage implements storage in memory.
 */
export interface Storage extends S {
    /** Stops refresh cycle. */
    quit(): void;
}
/**
 * Creates new Storage.
 * @param refreshInterval Interval to remove stale keys in milliseconds.
 */
export declare function createStorage(refreshInterval: number): Storage;
