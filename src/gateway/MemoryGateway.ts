import { IGateway, IOkTTL, IOk } from '../IGateway';
import { MemoryStorage } from './MemoryStorage';

export interface IValueTTL {
  value: string;
  ttl: number;
}

/** Implements gateway to memory storage. */
export class MemoryGateway implements IGateway {
  private storage: MemoryStorage;
  private timer: NodeJS.Timer;

  constructor(cleanupInterval: number) {
    this.storage = new MemoryStorage();
    this.timer = setInterval(() => {
      this.storage.deleteExpired();
    }, cleanupInterval);
    this.timer.unref();
  }

  public async set(key: string, value: string, ttl: number): Promise<IOkTTL> {
    return this.storage.set(key, value, ttl);
  }

  public async del(key: string, value: string): Promise<IOk> {
    return this.storage.del(key, value);
  }

  /** Gets value and TTL of a key. For testing. */
  public get(key: string): IValueTTL {
    return this.storage.get(key);
  }

  /** Stops timer created at constructor. */
  public stopCleanupTimer() {
    clearInterval(this.timer);
  }
}
