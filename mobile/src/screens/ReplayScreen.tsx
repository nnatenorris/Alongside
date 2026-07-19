import React, { useEffect, useState } from 'react';
import { Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getReplay, ReplayInfo } from '../api/reactions';
import ReplayPlayer from '../components/ReplayPlayer';

const POLL_INTERVAL_MS = 3000;

type Phase = 'loading' | 'pending' | 'ready' | 'error';

export default function ReplayScreen({ shareId }: { shareId: string }) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [replay, setReplay] = useState<ReplayInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const poll = () => {
      getReplay(shareId)
        .then(info => {
          if (cancelled) return;
          if (info.status === 'ready') {
            setReplay(info);
            setPhase('ready');
          } else {
            setPhase('pending');
            timer = setTimeout(poll, POLL_INTERVAL_MS);
          }
        })
        .catch(e => {
          if (cancelled) return;
          setError(e instanceof Error ? e.message : 'Could not load the reaction.');
          setPhase('error');
        });
    };
    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [shareId]);

  if (phase === 'loading' || phase === 'pending') {
    return (
      <SafeAreaView style={[styles.screen, styles.centered]}>
        <ActivityIndicator color="#4de8c7" />
        <Text style={styles.waiting}>
          {phase === 'pending'
            ? 'Waiting for their reaction…'
            : 'Loading…'}
        </Text>
      </SafeAreaView>
    );
  }

  if (phase === 'error') {
    return (
      <SafeAreaView style={[styles.screen, styles.centered]}>
        <Text style={styles.error}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (replay?.status !== 'ready') return null;

  return (
    <SafeAreaView style={styles.screen}>
      <ReplayPlayer
        videoId={replay.video_id}
        startSeconds={replay.captured_from}
        reactionUrl={replay.reaction_url}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b0d10' },
  centered: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  waiting: { color: '#9aa0a6', fontSize: 14, marginTop: 16 },
  error: { color: '#e0568c', fontSize: 15, textAlign: 'center' },
});
