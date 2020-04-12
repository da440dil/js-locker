import { IGateway, IOkTTL, IOk } from './IGateway';

/** Lock implements distributed locking. */
export class Lock {
  private gateway: IGateway;
  private ttl: number;
  private key: string;
  private token: string;

  constructor({ gateway, ttl, key, token }: {
    gateway: IGateway;
    ttl: number;
    key: string;
    token: string;
  }) {
    this.gateway = gateway;
    this.ttl = ttl;
    this.key = key;
    this.token = token;
  }

  /** Applies the lock. */
  public lock(): Promise<IOkTTL> {
    return this.gateway.set(this.key, this.token, this.ttl);
  }

  /** Releases the lock. */
  public unlock(): Promise<IOk> {
    return this.gateway.del(this.key, this.token);
  }
}
