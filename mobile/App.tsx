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
import ReactionCaptureScreen from './src/screens/ReactionCaptureScreen';
import ReplayScreen from './src/screens/ReplayScreen';

type Screen =
  | { name: 'composer' }
  | { name: 'open' }
  | { name: 'consent'; token: string }
  | { name: 'capture'; shareId: string; videoId: string; startSeconds: number }
  | { name: 'replay'; shareId: string };

function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'composer' });

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      {screen.name === 'composer' && (
        <ComposerScreen
          onOpenLink={() => setScreen({ name: 'open' })}
          onViewReplay={shareId => setScreen({ name: 'replay', shareId })}
        />
      )}
      {screen.name === 'open' && (
        <OpenLinkScreen
          onToken={token => setScreen({ name: 'consent', token })}
        />
      )}
      {screen.name === 'consent' && (
        <ConsentScreen
          token={screen.token}
          onAllow={({ shareId, videoId, startSeconds }) =>
            setScreen({ name: 'capture', shareId, videoId, startSeconds })
          }
        />
      )}
      {screen.name === 'capture' && (
        <ReactionCaptureScreen
          shareId={screen.shareId}
          videoId={screen.videoId}
          startSeconds={screen.startSeconds}
        />
      )}
      {screen.name === 'replay' && (
        <ReplayScreen shareId={screen.shareId} />
      )}
    </SafeAreaProvider>
  );
}

export default App;
