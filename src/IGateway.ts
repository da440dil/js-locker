/** Gateway to storage to store a lock state. */
export interface IGateway {
  /**
   * Sets key value and TTL of key if key not exists.
   * Updates TTL of key if key exists and key value equals input value.
   */
  set(key: string, value: string, ttl: number): Promise<IOkTTL>;

  /**
   * Deletes key if key value equals input value.
   */
  del(key: string, value: string): Promise<IOk>;
}

/** Result of delete operation. */
export interface IOk {
  /** Operation success flag. */
  ok: boolean;
}

/** Result of set operation. */
export interface IOkTTL extends IOk {
  /** TTL of a key in milliseconds. */
  ttl: number;
}
