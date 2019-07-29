import { createToken } from './token'
import * as crypto from 'crypto'

jest.mock('crypto')

afterAll(() => {
  jest.unmock('crypto')
})

describe('token', () => {
  it('should create random token', async () => {
    const rndMock = jest.spyOn(crypto, 'randomBytes')
    const token = 'token'
    rndMock.mockImplementation((_, cb) => {
      cb(null, Buffer.from(token))
    })

    await expect(createToken()).resolves.toBe(Buffer.from(token).toString('base64'))

    rndMock.mockRestore()
  })

  it('should throw Error if crypto throws Error', async () => {
    const rndMock = jest.spyOn(crypto, 'randomBytes')
    const err = new Error('any')
    rndMock.mockImplementation((_, cb) => {
      cb(err, Buffer.alloc(0))
    })

    await expect(createToken()).rejects.toThrow(err)

    rndMock.mockRestore()
  })
})
