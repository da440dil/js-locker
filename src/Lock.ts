import { LockerScript } from './LockerScript';
import { ILock, Result } from './LockResult';

export class Lock implements ILock {
	private locker: LockerScript;
	private key: string;
	private token: string;

	constructor(locker: LockerScript, key: string, token: string) {
		this.locker = locker;
		this.key = key;
		this.token = token;
	}

	public async lock(): Promise<Result> {
		const v = await this.locker.lock(this.key, this.token);
		return { ok: v < -2, ttl: v };
	}

	public async unlock(): Promise<boolean> {
		const v = await this.locker.unlock(this.key, this.token);
		return v === 1;
	}
}
