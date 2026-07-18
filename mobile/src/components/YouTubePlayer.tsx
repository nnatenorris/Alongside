import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import { buildPlayerHtml } from '../lib/youtubePlayerHtml';

export type PlayerEvent =
  | { type: 'READY' }
  | { type: 'START_CAPTURE'; atSeconds: number }
  | { type: 'STOP_CAPTURE' }
  | { type: 'ERROR'; data: number };

export default function YouTubePlayer({
  videoId,
  startSeconds,
  onEvent,
}: {
  videoId: string;
  startSeconds: number;
  onEvent: (event: PlayerEvent) => void;
}) {
  const html = useMemo(
    () => buildPlayerHtml(videoId, startSeconds),
    [videoId, startSeconds],
  );

  const handleMessage = (e: WebViewMessageEvent) => {
    try {
      const event = JSON.parse(e.nativeEvent.data) as PlayerEvent;
      onEvent(event);
    } catch {
      // malformed message from the page — ignore
    }
  };

  return (
    <View style={styles.wrapper}>
      <WebView
        source={{ html }}
        onMessage={handleMessage}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  webview: { flex: 1, backgroundColor: '#000' },
});
