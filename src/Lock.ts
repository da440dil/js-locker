import { createHash } from 'crypto';
import { RedisClient } from 'redis';

const lockScript = `
local token = redis.call("get", KEYS[1])
if token == false then
	redis.call("set", KEYS[1], ARGV[1], "px", ARGV[2])
	return -3
end
if token == ARGV[1] then
	redis.call("pexpire", KEYS[1], ARGV[2])
	return -4
end
return redis.call("pttl", KEYS[1])
`;

const unlockScript = `
if redis.call("get", KEYS[1]) == ARGV[1] then
	return redis.call("del", KEYS[1])
end
return 0
`;

const lockHash = createHash('sha1').update(lockScript).digest('hex');
const unlockHash = createHash('sha1').update(unlockScript).digest('hex');

/** Result of lock() operation. */
export interface IResult {
    /** Operation success flag. */
    ok: boolean;
    /**
     * TTL of a lock in milliseconds.
     * Makes sense if operation failed, otherwise ttl is less than 0.
     */
    ttl: number;
}

/** Implements distributed locking. */
export interface ILock {
    /** Applies the lock. */
    lock(): Promise<IResult>;
    /** Releases the lock. */
    unlock(): Promise<boolean>;
}

/** Error message which is thrown when Redis command returns response of invalid type. */
export const errMsgInvalidResponse = 'Invalid redis response';

export class Lock implements ILock {
    private client: RedisClient;
    private ttl: number;
    private key: string;
    private token: string;

    constructor({ client, ttl, key, token }: {
        client: RedisClient;
        ttl: number;
        key: string;
        token: string;
    }) {
        this.client = client;
        this.ttl = ttl;
        this.key = key;
        this.token = token;
    }

    public async lock(): Promise<IResult> {
        try {
            return await this.evalshaLock();
        } catch (err) {
            if (!isNoScriptErr(err)) {
                throw err;
            }
            await this.load(lockScript);
            return this.evalshaLock();
        }
    }

    public async unlock(): Promise<boolean> {
        try {
            return await this.evalshaUnlock();
        } catch (err) {
            if (!isNoScriptErr(err)) {
                throw err;
            }
            await this.load(unlockScript);
            return this.evalshaUnlock();
        }
    }

    private async evalshaLock(): Promise<IResult> {
        return new Promise((resolve, reject) => {
            this.client.evalsha(lockHash, 1, this.key, this.token, this.ttl, (err, res) => {
                if (err) {
                    return reject(err);
                }
                if (typeof res !== 'number') {
                    return reject(new Error(errMsgInvalidResponse));
                }
                resolve({ ok: res < -2, ttl: res });
            });
        });
    }

    private async evalshaUnlock(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.client.evalsha(unlockHash, 1, this.key, this.token, (err, res) => {
                if (err) {
                    return reject(err);
                }
                if (typeof res !== 'number') {
                    return reject(new Error(errMsgInvalidResponse));
                }
                resolve(res === 1);
            });
        });
    }

    private load(script: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.client.script('load', script, (err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }
}

function isNoScriptErr(err: unknown): boolean {
    return err instanceof Error && err.message.startsWith('NOSCRIPT ');
}
