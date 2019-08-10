/** Gateway to storage to store a lock state. */
export interface Gateway {
  /**
   * Sets key value and TTL of key if key not exists.
   * Updates TTL of key if key exists and key value equals input value.
   */
  set(key: string, value: string, ttl: number): Promise<OkTTL>

  /**
   * Deletes key if key value equals input value.
   */
  del(key: string, value: string): Promise<Ok>
}

export interface Ok {
  /** Operation success flag. */
  ok: boolean
}

export interface OkTTL extends Ok {
  /** TTL of a key in milliseconds. */
  ttl: number
}
