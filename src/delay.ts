export function createDelay(retryDelay: number, retryJitter: number): number {
  if (retryJitter === 0) {
    return retryDelay
  }
  return Math.max(0, retryDelay + Math.floor((Math.random() * 2 - 1) * retryJitter))
}
