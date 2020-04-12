import { IGateway } from './IGateway';
import { Lock } from './Lock';
import { Locker } from './Locker';
import { TTLError } from './TTLError';
import { MemoryGateway } from './gateway/MemoryGateway';

const gateway = {} as jest.Mocked<IGateway>;

const invalidKey = Buffer.alloc(Locker.MaxKeySize + 1).toString();

describe('Locker', () => {
  const key = 'key';
  let locker: Locker;

  beforeEach(() => {
    locker = new Locker({ gateway, ttl: 1 });
  });

  describe('lock', () => {
    it('should throw Error if gateway#set throws Error', async () => {
      const err = new Error('any');
      gateway.set = jest.fn().mockRejectedValue(err);

      await expect(locker.lock(key)).rejects.toThrow(err);
    });

    it('should throw TTLError if gateway#set fails', async () => {
      const v = { ok: false, ttl: 42 };
      gateway.set = jest.fn().mockResolvedValue(v.ttl);

      await expect(locker.lock(key)).rejects.toThrow(new TTLError(v.ttl));
    });

    it('should throw Error if got invalid key', async () => {
      await expect(locker.lock(invalidKey)).rejects.toThrow(new Error(Locker.ErrInvalidKey));
    });

    it('should not throw Error if gateway#set does not fail', async () => {
      const v = { ok: true, ttl: -1 };
      gateway.set = jest.fn().mockResolvedValue(v);

      await expect(locker.lock(key)).resolves.toBeInstanceOf(Lock);
    });
  });

  describe('createLock', () => {
    it('should throw Error if got invalid key', async () => {
      await expect(locker.createLock(invalidKey)).rejects.toThrow(new Error(Locker.ErrInvalidKey));
    });

    it('should create new Lock', async () => {
      await expect(locker.createLock(key)).resolves.toBeInstanceOf(Lock);
    });
  });
});

describe('Locker constructor', () => {
  it('should create Locker with gateway', () => {
    expect(new Locker({ ttl: 1, gateway: new MemoryGateway(100) })).toBeInstanceOf(Locker);
  });

  it('should create Locker with default gateway', () => {
    expect(new Locker({ ttl: 1 })).toBeInstanceOf(Locker);
  });

  it('should create Locker with random generator', () => {
    expect(new Locker({ ttl: 1, random: (_: number) => Promise.resolve(Buffer.alloc(0)) })).toBeInstanceOf(Locker);
  });

  it('should create Locker with random bytes size for random generator', () => {
    expect(new Locker({ ttl: 1, randomBytesSize: 1 })).toBeInstanceOf(Locker);
  });

  it('should throw Error if got invalid ttl parameter', () => {
    expect(() => new Locker({ ttl: 0 })).toThrow(new Error(Locker.ErrInvalidTTL));
  });

  it('should throw Error if got invalid randomBytesSize parameter', () => {
    expect(() => new Locker({ ttl: 1, randomBytesSize: 0 })).toThrow(new Error(Locker.ErrInvalidRandomBytesSize));
  });

  it('should throw Error if got invalid prefix parameter', () => {
    expect(() => new Locker({ ttl: 1, prefix: invalidKey })).toThrow(new Error(Locker.ErrInvalidKey));
  });
});
