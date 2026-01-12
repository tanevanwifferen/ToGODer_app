// Platform-specific implementations:
// - CryptoService.native.ts for iOS/Android (react-native-quick-crypto)
// - CryptoService.web.ts for Web (Web Crypto API)
//
// This file is used by TypeScript for type checking.
// Metro/webpack will resolve to the correct platform-specific file at runtime.

export { CryptoService } from './CryptoService.native';
