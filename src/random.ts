import { randomBytes } from 'crypto';

/** Random generator for generation lock tokens. */
export type RandomBytes = (bytesSize: number) => Promise<Buffer>;

export function createRandomBytes(bytesSize: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    randomBytes(bytesSize, (err, buf) => {
      if (err) {
        return reject(err);
      }
      resolve(buf);
    });
  });
}
