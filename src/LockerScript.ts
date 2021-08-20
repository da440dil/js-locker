import { readFileSync } from 'fs';
import { join } from 'path';
import { IRedisClient, IRedisScript, createScript } from '@da440dil/js-redis-script';

const locksrc = readFileSync(join(__dirname, 'lock.lua')).toString();
const unlocksrc = readFileSync(join(__dirname, 'unlock.lua')).toString();

export class LockerScript {
	private lockScript: IRedisScript<number>;
	private unlockScript: IRedisScript<number>;
	private ttl: number;

	constructor(client: IRedisClient, ttl: number) {
		this.lockScript = createScript({ client, src: locksrc, numberOfKeys: 1 });
		this.unlockScript = createScript({ client, src: unlocksrc, numberOfKeys: 1 });
		this.ttl = ttl;
	}

	public lock(key: string, token: string): Promise<number> {
		return this.lockScript.run(key, token, this.ttl);
	}

	public unlock(key: string, token: string): Promise<number> {
		return this.unlockScript.run(key, token);
	}
}
