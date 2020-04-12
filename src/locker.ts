import { IGateway } from './IGateway';
import { MemoryGateway } from './gateway/MemoryGateway';
import { Lock } from './Lock';
import { CreateRandomBytes, createRandomBytes } from './random';
import { TTLError } from './TTLError';

/** Locker defines parameters for creating new Lock. */
export class Locker {
  /** Error message which is thrown when Locker constructor receives invalid value of TTL. */
  public static readonly ErrInvalidTTL = 'ttl must be an integer greater than 0';
  /** Error message which is thrown when key size is greater than 512 MB. */
  public static readonly ErrInvalidKey = 'key size must be less than or equal to 512 MB';
  /** Error message which is thrown when random bytes size less than or equal to 0 */
  public static readonly ErrInvalidRandomBytesSize = 'random bytes size must be greater than 0';
  /** Maximum key size in bytes. */
  public static readonly MaxKeySize = 512000000;

  private static validateKey(key: string): void {
    if (!isValidKey(key)) {
      throw new Error(Locker.ErrInvalidKey);
    }
  }

  private static validateTTL(ttl: number): void {
    if (!isPositiveInteger(ttl)) {
      throw new Error(Locker.ErrInvalidTTL);
    }
  }

  private static validateRandomBytesSize(v: number): void {
    if (!isPositiveInteger(v)) {
      throw new Error(Locker.ErrInvalidRandomBytesSize);
    }
  }

  private gateway: IGateway;
  private createRandomBytes: CreateRandomBytes;
  private randomBytesSize: number;
  private ttl: number;
  private prefix: string;

  constructor({ ttl, random, randomBytesSize, prefix, gateway }: {
    /** TTL of a key in milliseconds. Must be greater than 0. */
    ttl: number;
    /**
     * Gateway to storage to store a lock state.
     * If gateway not defined counter creates new memory gateway
     * with expired keys cleanup every 100 milliseconds.
     */
    gateway?: IGateway;
    /** Prefix of a key. By default empty string. */
    prefix?: string;
    /**
     * Random generator for generation lock tokens.
     * By default crypto.randomBytes.
     */
    random?: CreateRandomBytes;
    /**
     * Bytes size to read from random generator for generation lock tokens.
     * Must be greater than 0.
     * By default 16.
     */
    randomBytesSize?: number;
  }) {
    Locker.validateTTL(ttl);
    if (randomBytesSize === undefined) {
      randomBytesSize = 16;
    } else {
      Locker.validateRandomBytesSize(randomBytesSize);
    }
    if (prefix === undefined) {
      prefix = '';
    } else {
      Locker.validateKey(prefix);
    }
    this.gateway = gateway === undefined ? new MemoryGateway(100) : gateway;
    this.createRandomBytes = random === undefined ? createRandomBytes : random;
    this.randomBytesSize = randomBytesSize;
    this.ttl = ttl;
    this.prefix = prefix;
  }

  /** Creates and applies new Lock. Throws TTLError if Lock failed to lock the key. */
  public async lock(key: string): Promise<Lock> {
    const lock = await this.createLock(key);
    const res = await lock.lock();
    if (res.ok) {
      return lock;
    }
    throw new TTLError(res.ttl);
  }

  /** Creates new Lock. */
  public async createLock(key: string): Promise<Lock> {
    key = this.prefix + key;
    Locker.validateKey(key);
    const buf = await this.createRandomBytes(this.randomBytesSize);
    return new Lock({
      gateway: this.gateway,
      ttl: this.ttl,
      key,
      token: buf.toString('base64'),
    });
  }
}

function isValidKey(key: string): boolean {
  return Buffer.byteLength(key, 'utf8') <= Locker.MaxKeySize;
}

function isPositiveInteger(v: number): boolean {
  return Number.isSafeInteger(v) && v > 0;
}
