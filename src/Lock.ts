import { LockerScript } from './LockerScript';

export class Lock implements ILock {
	private locker: LockerScript;
	private key: string;
	private token: string;

	constructor(locker: LockerScript, key: string, token: string) {
		this.locker = locker;
		this.key = key;
		this.token = token;
	}

	public async lock(): Promise<IResult> {
		const v = await this.locker.lock(this.key, this.token);
		return { ok: v < -2, ttl: v };
	}

	public async unlock(): Promise<boolean> {
		const v = await this.locker.unlock(this.key, this.token);
		return v === 1;
	}
}

/** Implements distributed locking. */
export interface ILock {
	/** Applies the lock. */
	lock(): Promise<IResult>;
	/** Releases the lock. */
	unlock(): Promise<boolean>;
}

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
