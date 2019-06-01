"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
/** Error message returned when Locker constructor receives invalid value of ttl. */
exports.ErrInvalidTTL = 'ttl must be an integer greater than zero';
/** Error message returned when Locker constructor receives invalid value of retryCount. */
exports.ErrInvalidRetryCount = 'retryCount must be an integer greater than or equal to zero';
/** Error message returned when Locker constructor receives invalid value of retryDelay. */
exports.ErrInvalidRetryDelay = 'retryDelay must be an integer greater than or equal to zero';
/** Error message returned when Locker constructor receives invalid value of retryJitter. */
exports.ErrInvalidRetryJitter = 'retryJitter must be an integer greater than or equal to zero';
/** Error message returned when lock failed. */
exports.ErrConflict = 'Conflict';
/**
 * Error returned when lock failed.
 */
class LockerError extends Error {
    constructor(ttl) {
        super(exports.ErrConflict);
        this._ttl = ttl;
    }
    get ttl() {
        return this._ttl;
    }
}
exports.LockerError = LockerError;
/**
 * Locker defines parameters for creating new Lock.
 */
class Locker {
    constructor(storage, { ttl, retryCount = 0, retryDelay = 0, retryJitter = 0, prefix = '' }) {
        if (!(Number.isSafeInteger(ttl) && ttl > 0)) {
            throw new Error(exports.ErrInvalidTTL);
        }
        if (!(Number.isSafeInteger(retryCount) && retryCount >= 0)) {
            throw new Error(exports.ErrInvalidRetryCount);
        }
        if (!(Number.isSafeInteger(retryDelay) && retryDelay >= 0)) {
            throw new Error(exports.ErrInvalidRetryDelay);
        }
        if (!(Number.isSafeInteger(retryJitter) && retryJitter >= 0)) {
            throw new Error(exports.ErrInvalidRetryJitter);
        }
        this._storage = storage;
        this._params = {
            ttl,
            retryCount,
            retryDelay,
            retryJitter,
            prefix,
        };
    }
    /** Creates new Lock. */
    createLock(key) {
        return new Lock(this._storage, this._params, key);
    }
    /** Applies the lock. */
    async lock(key) {
        const lock = this.createLock(key);
        const ttl = await lock.lock();
        if (ttl !== -1) {
            throw new LockerError(ttl);
        }
        return lock;
    }
}
exports.Locker = Locker;
/**
 * Lock implements distributed locking.
 */
class Lock {
    constructor(storage, { ttl, retryCount, retryDelay, retryJitter, prefix }, key) {
        this._storage = storage;
        this._ttl = ttl;
        this._retryCount = retryCount;
        this._retryDelay = retryDelay;
        this._retryJitter = retryJitter;
        this._key = prefix + key;
        this._token = '';
    }
    /** Applies the lock. Returns -1 on success, ttl in milliseconds on failure. */
    lock() {
        if (this._token === '') {
            return this._create();
        }
        return this._update();
    }
    /** Releases the lock. Returns true on success, false on failure. */
    unlock() {
        const token = this._token;
        if (token === '') {
            return Promise.resolve(false);
        }
        this._token = '';
        return this._storage.remove(this._key, token);
    }
    async _create() {
        const token = await createToken();
        return this._insert(token, this._retryCount);
    }
    async _insert(token, counter) {
        const v = await this._storage.insert(this._key, token, this._ttl);
        if (v === -1) {
            this._token = token;
            return v;
        }
        if (counter <= 0) {
            return v;
        }
        counter--;
        await sleep(createDelay(this._retryDelay, this._retryJitter));
        return this._insert(token, counter);
    }
    async _update() {
        const v = await this._storage.upsert(this._key, this._token, this._ttl);
        if (v === -1) {
            return v;
        }
        this._token = '';
        return this._create();
    }
}
exports.Lock = Lock;
function createToken() {
    return new Promise((resolve, reject) => {
        crypto_1.randomBytes(16, (err, buf) => {
            if (err) {
                return reject(err);
            }
            resolve(buf.toString('base64'));
        });
    });
}
function createDelay(retryDelay, retryJitter) {
    if (retryJitter === 0) {
        return retryDelay;
    }
    return Math.max(0, retryDelay + Math.floor((Math.random() * 2 - 1) * retryJitter));
}
function sleep(time) {
    return new Promise((resolve) => {
        setTimeout(resolve, time);
    });
}
