"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Creates new Storage.
 * @param refreshInterval Interval to remove stale keys in milliseconds.
 */
function createStorage(refreshInterval) {
    return new MemoryStorage(refreshInterval);
}
exports.createStorage = createStorage;
class MemoryStorage {
    constructor(timeout) {
        this._db = new Map();
        this._timeout = timeout;
        this._init();
    }
    _init() {
        this._timer = setTimeout(() => {
            if (this._timer === undefined) {
                return;
            }
            for (let [k, v] of this._db) {
                v.ttl = v.ttl - this._timeout;
                if (v.ttl <= 0) {
                    this._db.delete(k);
                }
            }
            this._init();
        }, this._timeout);
    }
    quit() {
        if (this._timer === undefined) {
            return;
        }
        clearTimeout(this._timer);
        this._timer = undefined;
    }
    async insert(key, value, ttl) {
        const v = this._db.get(key);
        if (v !== undefined) {
            return v.ttl;
        }
        this._db.set(key, { value: value, ttl: ttl });
        return -1;
    }
    async upsert(key, value, ttl) {
        const v = this._db.get(key);
        if (v === undefined) {
            this._db.set(key, { value: value, ttl: ttl });
            return -1;
        }
        if (v.value === value) {
            v.ttl = ttl;
            return -1;
        }
        return v.ttl;
    }
    async remove(key, value) {
        const v = this._db.get(key);
        if (v !== undefined && v.value === value) {
            this._db.delete(key);
            return true;
        }
        return false;
    }
}
