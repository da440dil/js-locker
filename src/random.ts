import { randomBytes } from 'crypto'

/** Random generator for generation lock tokens. */
export type Random = (bytesSize: number) => Promise<Buffer>

export function random(bytesSize: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    randomBytes(bytesSize, (err, buf) => {
      if (err) {
        return reject(err)
      }
      resolve(buf)
    })
  })
}
