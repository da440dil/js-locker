import { TTLError } from './TTLError';

describe('TTLError constructor', () => {
  it('should create TTLError with ttl property', () => {
    const ttl = 42;
    const err = new TTLError(ttl);
    expect(err.message).toBe(TTLError.ErrConflict);
    expect(err.ttl).toBe(ttl);
  });
});
