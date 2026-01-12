module.exports = {
  randomBytes: (size) => Buffer.alloc(size),
  createCipheriv: () => ({
    update: () => Buffer.from(''),
    final: () => Buffer.from(''),
  }),
  createDecipheriv: () => ({
    update: () => Buffer.from(''),
    final: () => Buffer.from(''),
  }),
  pbkdf2Sync: () => Buffer.alloc(32),
};
