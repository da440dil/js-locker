import { readFileSync } from 'fs';
import { join } from 'path';
import { RedisScript } from '@da440dil/js-redis-script';

export const locksrc = readFileSync(join(__dirname, './lock.lua')).toString();
export const unlocksrc = readFileSync(join(__dirname, './unlock.lua')).toString();

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
	private lockScript: RedisScript<number>;
	private unlockScript: RedisScript<number>;
	private ttl: number;
	private key: string;
	private token: string;

	constructor(
		lockScript: RedisScript<number>,
		unlockScript: RedisScript<number>,
		ttl: number,
		key: string,
		token: string
	) {
		this.lockScript = lockScript;
		this.unlockScript = unlockScript;
		this.ttl = ttl;
		this.key = key;
		this.token = token;
	}

	public async lock(): Promise<IResult> {
		const res = await this.lockScript.run(this.key, this.token, this.ttl);
		return { ok: res < -2, ttl: res };
	}

	public async unlock(): Promise<boolean> {
		const res = await this.unlockScript.run(this.key, this.token);
		return res === 1;
	}
}
