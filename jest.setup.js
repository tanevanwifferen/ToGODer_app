jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-quick-crypto', () => ({
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
}), { virtual: true });

jest.mock('@craftzdog/react-native-buffer', () => ({
  Buffer: global.Buffer || require('buffer').Buffer,
}), { virtual: true });
