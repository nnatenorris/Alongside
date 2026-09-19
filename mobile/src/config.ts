import { Platform } from 'react-native';

// Testing on a real phone (not an emulator/simulator)? Put your computer's
// LAN IP here and make sure the phone is on the same Wi-Fi as the computer
// running the backend. Find it with `ipconfig getifaddr en0` (Mac Wi-Fi) or
// `ipconfig` (Windows, look for IPv4 Address). Leave blank to use the
// emulator/simulator defaults below.
const LAN_IP_OVERRIDE = '';

// Android emulator can't reach the host machine via localhost — 10.0.2.2 is
// the documented alias for it. iOS simulator can use localhost directly.
export const API_BASE_URL = LAN_IP_OVERRIDE
  ? `http://${LAN_IP_OVERRIDE}:4000`
  : Platform.select({
      android: 'http://10.0.2.2:4000',
      default: 'http://localhost:4000',
    });
