# js-locker

[![Build Status](https://travis-ci.com/da440dil/js-locker.svg?branch=master)](https://travis-ci.com/da440dil/js-locker)
[![Coverage Status](https://coveralls.io/repos/github/da440dil/js-locker/badge.svg?branch=master)](https://coveralls.io/github/da440dil/js-locker?branch=master)

Distributed locking with pluggable storage for storing locks state.

## Basic usage

```javascript
// Create new Locker
const locker = new Locker({ ttl: 100 })
try {
  // Create and apply lock
  const lock = await locker.lock('key')
  // Do smth  
  await lock.unlock() // Release lock
} catch (err) {
  if (err instanceof TTLError) {
    // Use err.TTL() if need
  } else {
    // Handle err
  }
}
```

## Example usage

- [example](./src/examples/locker-gateway-default.ts) usage with default [gateway](./src/gateway/memory/gateway.ts)
- [example](./src/examples/locker-gateway-memory.ts) usage with memory [gateway](./src/gateway/memory/gateway.ts)
- [example](./src/examples/locker-gateway-redis.ts) usage with [Redis](https://redis.io/) [gateway](./src/gateway/redis/gateway.ts)
- [example](./src/examples/locker-gateway-redis-2.ts) usage with [Redis](https://redis.io/) [gateway](./src/gateway/redis/gateway.ts) (with alternating locks)