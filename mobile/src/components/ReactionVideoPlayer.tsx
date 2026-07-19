import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import { buildReactionVideoHtml } from '../lib/reactionVideoHtml';

export interface ReactionVideoHandle {
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
}

export type ReactionVideoEvent = { type: 'ENDED' } | { type: 'ERROR'; message: string };

const ReactionVideoPlayer = forwardRef<
  ReactionVideoHandle,
  { videoUrl: string; visible: boolean; onEvent?: (event: ReactionVideoEvent) => void }
>(({ videoUrl, visible, onEvent }, ref) => {
  const webviewRef = useRef<React.ElementRef<typeof WebView>>(null);
  const html = useMemo(() => buildReactionVideoHtml(videoUrl), [videoUrl]);

  useImperativeHandle(ref, () => ({
    play: () => webviewRef.current?.injectJavaScript("window.__cmd('play'); true;"),
    pause: () => webviewRef.current?.injectJavaScript("window.__cmd('pause'); true;"),
    seek: (seconds: number) =>
      webviewRef.current?.injectJavaScript(`window.__cmd('seek', ${seconds}); true;`),
  }));

  const handleMessage = (e: WebViewMessageEvent) => {
    try {
      const event = JSON.parse(e.nativeEvent.data) as ReactionVideoEvent;
      onEvent?.(event);
    } catch {
      // malformed message from the page — ignore
    }
  };

  return (
    <View style={[styles.bubble, !visible && styles.hidden]}>
      <WebView
        ref={webviewRef}
        source={{ html, baseUrl: 'http://localhost' }}
        mixedContentMode="always"
        onMessage={handleMessage}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        style={styles.webview}
      />
    </View>
  );
});

export default ReactionVideoPlayer;

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    right: 16,
    bottom: 96,
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#4de8c7',
    backgroundColor: '#000',
  },
  hidden: { opacity: 0 },
  webview: { flex: 1, backgroundColor: '#000' },
});
