/**
 * Alongside
 * @format
 */

import { useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ComposerScreen from './src/screens/ComposerScreen';
import OpenLinkScreen from './src/screens/OpenLinkScreen';
import ConsentScreen from './src/screens/ConsentScreen';

type Screen =
  | { name: 'composer' }
  | { name: 'open' }
  | { name: 'consent'; token: string };

function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'composer' });

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      {screen.name === 'composer' && (
        <ComposerScreen onOpenLink={() => setScreen({ name: 'open' })} />
      )}
      {screen.name === 'open' && (
        <OpenLinkScreen
          onToken={token => setScreen({ name: 'consent', token })}
        />
      )}
      {screen.name === 'consent' && <ConsentScreen token={screen.token} />}
    </SafeAreaProvider>
  );
}

export default App;
