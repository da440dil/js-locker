export declare class Storage {
    private _db;
    private _timeout;
    private _timer?;
    /**
     * @param refreshInterval Interval to remove stale keys in milliseconds.
     */
    constructor(refreshInterval: number);
    private _init;
    quit(): void;
    insert(key: string, value: string, ttl: number): Promise<number>;
    upsert(key: string, value: string, ttl: number): Promise<number>;
    remove(key: string, value: string): Promise<boolean>;
}
