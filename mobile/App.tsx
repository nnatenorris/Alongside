/**
 * Alongside
 * @format
 */

import { useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import ComposerScreen from './src/screens/ComposerScreen';
import OpenLinkScreen from './src/screens/OpenLinkScreen';
import ConsentScreen from './src/screens/ConsentScreen';
import ReactionCaptureScreen from './src/screens/ReactionCaptureScreen';
import ReplayScreen from './src/screens/ReplayScreen';
import { SentShare } from './src/api/shares';

type Screen =
  | { name: 'home' }
  | { name: 'composer' }
  | { name: 'open'; purpose: 'consent' | 'replay' }
  | { name: 'consent'; token: string }
  | { name: 'capture'; shareId: string; videoId: string; startSeconds: number }
  | { name: 'replay'; shareId: string };

function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [sentShares, setSentShares] = useState<SentShare[]>([]);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      {screen.name === 'home' && (
        <HomeScreen
          sentShares={sentShares}
          onSend={() => setScreen({ name: 'composer' })}
          onViewReplay={share =>
            setScreen({ name: 'replay', shareId: share.shareId })
          }
          onOpenLink={() => setScreen({ name: 'open', purpose: 'consent' })}
          onLookupReplay={() => setScreen({ name: 'open', purpose: 'replay' })}
        />
      )}
      {screen.name === 'composer' && (
        <ComposerScreen
          onSent={share => {
            setSentShares(prev => [share, ...prev]);
            setScreen({ name: 'home' });
          }}
        />
      )}
      {screen.name === 'open' && (
        <OpenLinkScreen
          onToken={token =>
            screen.purpose === 'replay'
              ? setScreen({ name: 'replay', shareId: token })
              : setScreen({ name: 'consent', token })
          }
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
