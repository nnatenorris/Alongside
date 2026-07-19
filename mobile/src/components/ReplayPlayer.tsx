import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import { buildReplayPlayerHtml } from '../lib/youtubePlayerHtml';

export type ReplayEvent =
  | { type: 'READY' }
  | { type: 'ERROR'; data: number };

export default function ReplayPlayer({
  videoId,
  startSeconds,
  reactionUrl,
  onEvent,
}: {
  videoId: string;
  startSeconds: number;
  reactionUrl: string;
  onEvent?: (event: ReplayEvent) => void;
}) {
  const html = useMemo(
    () => buildReplayPlayerHtml(videoId, startSeconds, reactionUrl),
    [videoId, startSeconds, reactionUrl],
  );

  const handleMessage = (e: WebViewMessageEvent) => {
    try {
      const event = JSON.parse(e.nativeEvent.data) as ReplayEvent;
      onEvent?.(event);
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
