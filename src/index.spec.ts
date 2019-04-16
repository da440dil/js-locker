import 'mocha'
import assert from 'assert'
import sinon from 'sinon'
import {
  createLocker,
  Storage,
  ErrInvalidTTL,
  ErrInvalidRetryCount,
  ErrInvalidRetryDelay
} from '.'

const key = 'key'
const ttl = 1000
const retryCount = 2
const retryDelay = 20
const prefix = 'lock#'

describe('createLocker', () => {
  const storage = <Storage>{}

  it('should create Locker', () => {
    assert.doesNotThrow(() => {
      createLocker(storage, { ttl, retryCount, retryDelay, prefix })
    })
  })

  it('should throw if ttl is less than or equals to zero', () => {
    assert.throws(() => {
      createLocker(storage, { ttl: 0, retryCount, retryDelay, prefix })
    }, new Error(ErrInvalidTTL))
  })

  it('should throw if type of ttl is not integer', () => {
    assert.throws(() => {
      createLocker(storage, { ttl: 4.2, retryCount, retryDelay, prefix })
    }, new Error(ErrInvalidTTL))
  })

  it('should throw if retryCount is less than zero', () => {
    assert.throws(() => {
      createLocker(storage, { ttl, retryCount: -1, retryDelay, prefix })
    }, new Error(ErrInvalidRetryCount))
  })

  it('should throw if retryCount is not integer', () => {
    assert.throws(() => {
      createLocker(storage, { ttl, retryCount: 4.2, retryDelay, prefix })
    }, new Error(ErrInvalidRetryCount))
  })

  it('should throw if retryDelay is less than zero', () => {
    assert.throws(() => {
      createLocker(storage, { ttl, retryCount, retryDelay: -1, prefix })
    }, new Error(ErrInvalidRetryDelay))
  })

  it('should throw if retryDelay is not integer', () => {
    assert.throws(() => {
      createLocker(storage, { ttl, retryCount, retryDelay: 4.2, prefix })
    }, new Error(ErrInvalidRetryDelay))
  })
})

describe('Lock', () => {
  const storage = <Storage>{}

  const insert = sinon.stub().resolves(-1)
  const upsert = sinon.stub().resolves(-1)
  const remove = sinon.stub().resolves(true)
  storage.insert = insert
  storage.upsert = upsert
  storage.remove = remove

  const locker = createLocker(storage, { ttl, retryCount, retryDelay, prefix })
  const lock = locker.createLock(key)

  it('should lock', async () => {
    const v1 = await lock.lock()
    const v2 = await lock.lock()
    assert(v1 === -1)
    assert(v2 === -1)
    assert(insert.calledOnce)
    assert(upsert.calledOnce)
    const a1 = insert.getCall(0).args
    const a2 = upsert.getCall(0).args
    assert(a1[0] === prefix + key)
    assert(a2[0] === prefix + key)
    assert(typeof a1[1] === 'string' && typeof a2[1] === 'string' && a1[1] === a2[1])
    assert(a1[2] === ttl)
    assert(a2[2] === ttl)
  })

  it('should unlock', async () => {
    const v1 = await lock.unlock()
    const v2 = await lock.unlock()
    assert(v1 === true)
    assert(v2 === false)
    assert(remove.calledOnce)
    const a = remove.getCall(0).args
    assert(a[0] === prefix + key)
    assert(typeof a[1] === 'string')
  })

  it('should retry lock', async () => {
    const insert = sinon.stub().resolves(1)
    storage.insert = insert

    const v = await lock.lock()
    assert(v === 1)
    assert(insert.callCount === retryCount + 1)
  })
})
