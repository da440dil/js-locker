import { randomBytes } from 'crypto'

export function createToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    randomBytes(16, (err, buf) => {
      if (err) {
        return reject(err)
      }
      resolve(buf.toString('base64'))
    })
  })
}
