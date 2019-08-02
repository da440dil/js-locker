export function createDelay(retryDelay: number, retryJitter: number): number {
  if (retryJitter === 0) {
    return retryDelay
  }
  if (retryDelay < retryJitter) {
    [retryDelay, retryJitter] = [retryJitter, retryDelay]
  }
  const min = retryDelay - retryJitter
  const max = retryDelay + retryJitter
  return Math.floor(Math.random() * (max - min + 1)) + min
}
