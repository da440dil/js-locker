import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createScript, IRedisClient, INodeRedisClient, IRedisScript } from '@da440dil/js-redis-script';

const locksrc = readFileSync(resolve(__dirname, '../lock.lua')).toString();
const unlocksrc = readFileSync(resolve(__dirname, '../unlock.lua')).toString();

export class LockerScript {
	private lockScript: IRedisScript<number>;
	private unlockScript: IRedisScript<number>;

	constructor(client: IRedisClient | INodeRedisClient) {
		this.lockScript = createScript(client, locksrc, 1);
		this.unlockScript = createScript(client, unlocksrc, 1);
	}

	public lock(key: string, value: string, ttl: number): Promise<number> {
		return this.lockScript.run(key, value, ttl);
	}

	public unlock(key: string, value: string): Promise<number> {
		return this.unlockScript.run(key, value);
	}
}
