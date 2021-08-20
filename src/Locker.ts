import { LockerScript } from './LockerScript';
import { RandomBytesFunc } from './random';
import { IResult, ILock, Lock } from './Lock';

export class Locker implements ILocker {
	private locker: LockerScript;
	private createRandomBytes: RandomBytesFunc;
	private randomBytesSize: number;

	constructor(locker: LockerScript, randomBytesFunc: RandomBytesFunc, randomBytesSize: number) {
		this.locker = locker;
		this.createRandomBytes = randomBytesFunc;
		this.randomBytesSize = randomBytesSize;
	}

	public async lock(key: string): Promise<ILockResult> {
		const buf = await this.createRandomBytes(this.randomBytesSize);
		const lock = new Lock(this.locker, key, buf.toString('base64'));
		const result = await lock.lock();
		return { lock, result };
	}
}

/** Implements distributed locking. */
export interface ILocker {
	/** Creates and applies new lock. */
	lock(key: string): Promise<ILockResult>;
}

/** Contains new lock and result of applying the lock. */
export interface ILockResult {
	lock: ILock;
	result: IResult;
}
