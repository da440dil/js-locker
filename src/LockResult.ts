export class LockResult implements ILockResult {
	private _lock: ILock;
	private result: Result;

	constructor(lock: ILock, result: Result) {
		this._lock = lock;
		this.result = result;
	}

	public async lock(): Promise<Result> {
		return this._lock.lock();
	}

	public async unlock(): Promise<boolean> {
		return this._lock.unlock();
	}

	get ok(): boolean {
		return this.result.ok;
	}

	get ttl(): number {
		return this.result.ttl;
	}
}

/** Implements distributed locking. */
export interface ILock {
	/** Locks the lock if it is not already locked, otherwise extends the lock TTL. */
	lock(): Promise<Result>;
	/** Unlocks the lock. */
	unlock(): Promise<boolean>;
}

/** Result of locking a lock. */
export type Result = {
	/** Success flag of locking a lock. */
	ok: boolean;
	/**
	 * TTL of a lock in milliseconds.
	 * Makes sense if operation failed, otherwise ttl is less than 0.
	 */
	ttl: number;
};

/** Contains new lock and result of locking the lock. */
export interface ILockResult extends ILock, Result { }
