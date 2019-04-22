"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
/** ErrInvalidTTL is the error message returned when LockerFactory constructor receives invalid value of ttl. */
exports.ErrInvalidTTL = 'ttl must be an integer greater than zero';
/** ErrInvalidRetryCount is the error message returned when LockerFactory constructor receives invalid value of retryCount. */
exports.ErrInvalidRetryCount = 'retryCount must be an integer greater than or equal to zero';
/** ErrInvalidRetryDelay is the error message returned when LockerFactory constructor receives invalid value of retryDelay. */
exports.ErrInvalidRetryDelay = 'retryDelay must be an integer greater than or equal to zero';
/** ErrInvalidRetryJitter is the error message returned when LockerFactory constructor receives invalid value of retryJitter. */
exports.ErrInvalidRetryJitter = 'retryJitter must be an integer greater than or equal to zero';
/**
 * LockerFactory defines parameters for creating new Locker.
 */
class LockerFactory {
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
        this._ttl = ttl;
        this._retryCount = retryCount;
        this._retryDelay = retryDelay;
        this._retryJitter = retryJitter;
        this._prefix = prefix;
    }
    /** Creates new Locker. */
    createLocker(key) {
        return new Locker(this._storage, {
            ttl: this._ttl,
            retryCount: this._retryCount,
            retryDelay: this._retryDelay,
            retryJitter: this._retryJitter,
            key: this._prefix + key
        });
    }
}
exports.LockerFactory = LockerFactory;
/**
 * Locker implements distributed locking.
 */
class Locker {
    constructor(storage, { ttl, retryCount, retryDelay, retryJitter, key }) {
        this._storage = storage;
        this._ttl = ttl;
        this._retryCount = retryCount;
        this._retryDelay = retryDelay;
        this._retryJitter = retryJitter;
        this._key = key;
        this._token = '';
    }
    /** Applies the lock, returns -1 on success, ttl in milliseconds on failure. */
    lock() {
        if (this._token === '') {
            return this._create();
        }
        return this._update();
    }
    /** Releases the lock, returns true on success. */
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
        await sleep(Math.max(0, this._retryDelay + Math.floor((Math.random() * 2 - 1) * this._retryJitter)));
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
exports.Locker = Locker;
function createToken() {
    return new Promise((resolve, reject) => {
        crypto_1.randomBytes(16, (err, buf) => {
            if (err)
                return reject(err);
            resolve(buf.toString('base64'));
        });
    });
}
function sleep(time) {
    return new Promise((resolve) => {
        setTimeout(resolve, time);
    });
}
