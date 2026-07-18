import { Platform } from 'react-native';

// Android emulator can't reach the host machine via localhost — 10.0.2.2 is
// the documented alias for it. iOS simulator can use localhost directly.
// On a physical device, replace this with your machine's LAN IP.
export const API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:4000',
  default: 'http://localhost:4000',
});
