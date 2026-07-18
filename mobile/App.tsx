/**
 * Alongside
 * @format
 */

import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ComposerScreen from './src/screens/ComposerScreen';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <ComposerScreen />
    </SafeAreaProvider>
  );
}

export default App;
