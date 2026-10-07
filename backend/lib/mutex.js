const locks = new Map();

class Mutex {
  constructor() {
    this.queue = [];
    this.locked = false;
  }

  async lock() {
    return new Promise(resolve => {
      if (!this.locked) {
        this.locked = true;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }

  unlock() {
    if (this.queue.length > 0) {
      const resolve = this.queue.shift();
      resolve();
    } else {
      this.locked = false;
    }
  }
}

async function withLock(key, fn) {
  if (!locks.has(key)) {
    locks.set(key, new Mutex());
  }
  const mutex = locks.get(key);
  await mutex.lock();
  try {
    return await fn();
  } finally {
    mutex.unlock();
  }
}

module.exports = { withLock };
