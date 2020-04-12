import { MemoryGateway } from './MemoryGateway';

const key = 'key';
const value = 'value';
const ttl = 100;
let gateway: MemoryGateway;

describe('Memory Gateway', () => {
  beforeEach(() => {
    gateway = new MemoryGateway(Math.floor(ttl / 2));
  });

  afterAll(() => {
    gateway.stopCleanupTimer();
  });

  it('should set key value and TTL of key if key not exists', async () => {
    const res = await gateway.set(key, value, ttl);
    expect(res.ok).toBe(true);
    expect(res.ttl).toBe(ttl);

    let k = gateway.get(key);
    expect(k.value).toBe(value);
    expect(k.ttl).toBeGreaterThan(0);
    expect(k.ttl).toBeLessThanOrEqual(ttl);

    await sleep(ttl);

    k = gateway.get(key);
    expect(k.value).toBe('');
    expect(k.ttl).toBe(-2);
  });

  it('should update TTL of key if key exists and key value equals input value', async () => {
    await gateway.set(key, value, ttl);

    const res = await gateway.set(key, value, ttl);
    expect(res.ok).toBe(true);
    expect(res.ttl).toBe(ttl);

    let k = gateway.get(key);
    expect(k.value).toBe(value);
    expect(k.ttl).toBeGreaterThan(0);
    expect(k.ttl).toBeLessThanOrEqual(ttl);

    await sleep(ttl);

    k = gateway.get(key);
    expect(k.value).toBe('');
    expect(k.ttl).toBe(-2);
  });

  it('should neither set key value nor update TTL of key if key exists and key value not equals input value', async () => {
    const t = Math.floor(ttl / 2);
    await gateway.set(key, value, t);

    const res = await gateway.set(key, `${value}#${value}`, ttl);
    expect(res.ok).toBe(false);
    expect(res.ttl).toBeGreaterThan(0);
    expect(res.ttl).toBeLessThanOrEqual(t);

    const k = gateway.get(key);
    expect(k.value).toBe(value);
    expect(k.ttl).toBeGreaterThan(0);
    expect(k.ttl).toBeLessThanOrEqual(t);
  });

  it('should delete key if key value equals input value', async () => {
    await gateway.set(key, value, ttl);

    const res = await gateway.del(key, value);
    expect(res.ok).toBe(true);

    const k = gateway.get(key);
    expect(k.value).toBe('');
    expect(k.ttl).toBe(-2);
  });

  it('should not delete key if key value not equals input value', async () => {
    await gateway.set(key, value, ttl);

    const res = await gateway.del(key, `${value}#${value}`);
    expect(res.ok).toBe(false);

    const k = gateway.get(key);
    expect(k.value).toBe(value);
    expect(k.ttl).toBeGreaterThan(0);
    expect(k.ttl).toBeLessThanOrEqual(ttl);
  });
});

function sleep(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}
