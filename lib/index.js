"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
/**
 * Creates new Locker.
 */
function createLocker(storage, params) {
    return new LockerImpl(storage, params);
}
exports.createLocker = createLocker;
class LockerImpl {
    constructor(storage, { ttl, retryCount = 0, retryDelay = 0, prefix = '' }) {
        this._storage = storage;
        this._ttl = ttl;
        this._retryCount = retryCount;
        this._retryDelay = retryDelay;
        this._prefix = prefix;
    }
    createLock(key) {
        return new LockImpl(this._storage, this._ttl, this._retryCount, this._retryDelay, this._prefix + key);
    }
}
class LockImpl {
    constructor(storage, ttl, retryCount, retryDelay, key) {
        this._storage = storage;
        this._ttl = ttl;
        this._retryCount = retryCount;
        this._retryDelay = retryDelay;
        this._key = key;
        this._token = '';
    }
    lock() {
        if (this._token === '') {
            return this._create();
        }
        return this._update();
    }
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
        await sleep(this._retryDelay);
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
