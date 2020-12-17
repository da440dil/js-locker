import { randomBytes } from 'crypto';

/** Random generator to generate a lock token. */
export interface RandomBytesFunc {
  (bytesSize: number): Promise<Buffer>;
}

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
