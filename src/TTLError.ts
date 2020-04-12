/** Error which is thrown when Lock failed to lock the key. */
export class TTLError extends Error {
  /** Error message which is thrown when lock failed. */
  public static readonly ErrConflict = 'Conflict';

  /** TTL of a key in milliseconds. */
  public readonly ttl: number;

  constructor(ttl: number) {
    super(TTLError.ErrConflict);
    this.ttl = ttl;
  }
}
