import { random } from './random'
import * as crypto from 'crypto'

jest.mock('crypto')

afterAll(() => {
  jest.unmock('crypto')
})

describe('random', () => {
  const bytesSize = 16

  it('should create random bytes', async () => {
    const rndMock = jest.spyOn(crypto, 'randomBytes')
    const token = 'token'
    rndMock.mockImplementation((_, cb) => {
      cb(null, Buffer.from(token))
    })

    await expect(random(bytesSize)).resolves.toEqual(Buffer.from(token))

    rndMock.mockRestore()
  })

  it('should throw Error if crypto throws Error', async () => {
    const rndMock = jest.spyOn(crypto, 'randomBytes')
    const err = new Error('any')
    rndMock.mockImplementation((_, cb) => {
      cb(err, Buffer.alloc(0))
    })

    await expect(random(bytesSize)).rejects.toThrow(err)

    rndMock.mockRestore()
  })
})
