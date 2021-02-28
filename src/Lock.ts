import { RedisScript } from '@da440dil/js-redis-script';

export const lockSrc = `
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

export const unlockSrc = `
if redis.call("get", KEYS[1]) == ARGV[1] then
	return redis.call("del", KEYS[1])
end
return 0
`;

/** Result of applying a lock. */
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

export class Lock implements ILock {
    private ttl: number;
    private lockScript: RedisScript<number>;
    private unlockScript: RedisScript<number>;
    private key: string;
    private token: string;

    constructor({ ttl, lockScript, unlockScript, key, token }: {
        ttl: number;
        lockScript: RedisScript<number>;
        unlockScript: RedisScript<number>;
        key: string;
        token: string;
    }) {
        this.ttl = ttl;
        this.lockScript = lockScript;
        this.unlockScript = unlockScript;
        this.key = key;
        this.token = token;
    }

    public async lock(): Promise<IResult> {
        const res = await this.lockScript.run(1, this.key, this.token, this.ttl);
        return { ok: res < -2, ttl: res };
    }

    public async unlock(): Promise<boolean> {
        const res = await this.unlockScript.run(1, this.key, this.token);
        return res === 1;
    }
}
