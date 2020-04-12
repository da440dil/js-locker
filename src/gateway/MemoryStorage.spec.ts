import { MemoryStorage } from './MemoryStorage';

const key = 'key';
const value = 'value';
const ttl = 100;
let storage: MemoryStorage;

describe('Memory Storage', () => {
  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it('should set key value and TTL of key if key not exists', () => {
    const res = storage.set(key, value, ttl);
    expect(res.ok).toBe(true);
    expect(res.ttl).toBe(ttl);

    const k = storage.get(key);
    expect(k.value).toBe(value);
    expect(k.ttl).toBeGreaterThan(0);
    expect(k.ttl).toBeLessThanOrEqual(ttl);
  });

  it('should set key value and TTL of key if key exists and key is expired', () => {
    storage.set(key, value, -ttl);
    expect(storage.get(key)).toStrictEqual({ value: '', ttl: -2 });

    const res = storage.set(key, value, ttl);
    expect(res.ok).toBe(true);
    expect(res.ttl).toBe(ttl);

    const k = storage.get(key);
    expect(k.value).toBe(value);
    expect(k.ttl).toBeGreaterThan(0);
    expect(k.ttl).toBeLessThanOrEqual(ttl);
  });

  it('should update TTL of key if key exists and key value equals input value', () => {
    storage.set(key, value, ttl);

    const res = storage.set(key, value, ttl);
    expect(res.ok).toBe(true);
    expect(res.ttl).toBe(ttl);

    const k = storage.get(key);
    expect(k.value).toBe(value);
    expect(k.ttl).toBeGreaterThan(0);
    expect(k.ttl).toBeLessThanOrEqual(ttl);
  });

  it('should neither set key value nor update TTL of key if key exists and key value not equals input value', () => {
    const t = Math.floor(ttl / 2);
    storage.set(key, value, t);

    const res = storage.set(key, `${value}#${value}`, ttl);
    expect(res.ok).toBe(false);
    expect(res.ttl).toBeGreaterThan(0);
    expect(res.ttl).toBeLessThanOrEqual(t);

    const k = storage.get(key);
    expect(k.value).toBe(value);
    expect(k.ttl).toBeGreaterThan(0);
    expect(k.ttl).toBeLessThanOrEqual(t);
  });

  it('should delete key if key value equals input value', () => {
    storage.set(key, value, ttl);

    const res = storage.del(key, value);
    expect(res.ok).toBe(true);

    const k = storage.get(key);
    expect(k.value).toBe('');
    expect(k.ttl).toBe(-2);
  });

  it('should not delete key if key value not equals input value', () => {
    storage.set(key, value, ttl);

    const res = storage.del(key, `${value}#${value}`);
    expect(res.ok).toBe(false);

    const k = storage.get(key);
    expect(k.value).toBe(value);
    expect(k.ttl).toBeGreaterThan(0);
    expect(k.ttl).toBeLessThanOrEqual(ttl);
  });
});
