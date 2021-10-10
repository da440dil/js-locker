import { randomBytes } from 'crypto';
import { LockerScript } from './LockerScript';
import { Lock } from './Lock';
import { LockResult, ILockResult } from './LockResult';

export class Locker implements ILocker {
	private locker: LockerScript;

	constructor(locker: LockerScript) {
		this.locker = locker;
	}

	public async lock(key: string, ttl: number): Promise<ILockResult> {
		const value = await this.randomString();
		const lock = new Lock(this.locker, key, value);
		const result = await lock.lock(ttl);
		return new LockResult(lock, result);
	}

	private randomString(): Promise<string> {
		return new Promise((resolve, reject) => {
			randomBytes(16, (err, buf) => {
				if (err) {
					return reject(err);
				}
				resolve(buf.toString('base64'));
			});
		});
	}
}

/** Defines parameters for creating new lock. */
export interface ILocker {
	/** Creates and applies new lock. */
	lock(key: string, ttl: number): Promise<ILockResult>;
}
