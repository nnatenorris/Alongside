import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getShare, recordConsent, ShareInfo } from '../api/shares';

type Status = 'loading' | 'ready' | 'error' | 'watch_only';

export default function ConsentScreen({
  token,
  onAllow,
}: {
  token: string;
  onAllow: (info: {
    shareId: string;
    videoId: string;
    startSeconds: number;
  }) => void;
}) {
  const [status, setStatus] = useState<Status>('loading');
  const [share, setShare] = useState<ShareInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getShare(token)
      .then(info => {
        if (!cancelled) {
          setShare(info);
          setStatus('ready');
        }
      })
      .catch(e => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "This link isn't valid.");
          setStatus('error');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const decide = async (decision: 'allow' | 'watch_only') => {
    if (!share) return;
    try {
      await recordConsent(share.share_id, decision);
      if (decision === 'allow') {
        onAllow({
          shareId: share.share_id,
          videoId: share.video_id,
          startSeconds: share.start_offset,
        });
      } else {
        setStatus('watch_only');
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not record your choice.',
      );
    }
  };

  if (status === 'loading') {
    return (
      <SafeAreaView style={[styles.screen, styles.centered]}>
        <ActivityIndicator color="#4de8c7" />
      </SafeAreaView>
    );
  }

  if (status === 'error') {
    return (
      <SafeAreaView style={[styles.screen, styles.centered]}>
        <Text style={styles.error}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (status === 'watch_only') {
    return (
      <SafeAreaView style={[styles.screen, styles.centered]}>
        <Text style={styles.confirm}>Just watching — got it.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Image
          source={{ uri: share!.thumbnail_url }}
          style={styles.thumbnail}
        />
        <Text style={styles.heading}>{share!.sender_name} sent you this.</Text>
        <Text style={styles.body}>
          Your camera will record a short reaction while it plays — about 30
          seconds, starting when the video does.
        </Text>

        <Pressable
          style={[styles.button, styles.allow]}
          onPress={() => decide('allow')}>
          <Text style={styles.allowText}>Allow & Watch</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.ghost]}
          onPress={() => decide('watch_only')}>
          <Text style={styles.ghostText}>Just Watch</Text>
        </Pressable>

        <Text style={styles.retention}>
          Reactions are only visible to {share!.sender_name} and delete
          automatically after 7 days.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b0d10' },
  centered: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  content: { flex: 1, padding: 20, justifyContent: 'center' },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 14,
    backgroundColor: '#15181c',
  },
  heading: {
    color: '#edeef0',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 20,
  },
  body: {
    color: '#9aa0a6',
    fontSize: 14.5,
    lineHeight: 21,
    marginTop: 10,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  allow: { backgroundColor: '#4de8c7' },
  allowText: { color: '#04211c', fontWeight: '700', fontSize: 15 },
  ghost: { borderWidth: 1, borderColor: '#ffffff2a' },
  ghostText: { color: '#edeef0', fontWeight: '600', fontSize: 15 },
  retention: {
    color: '#5a6066',
    fontSize: 11.5,
    marginTop: 16,
    textAlign: 'center',
  },
  error: { color: '#e0568c', fontSize: 15, textAlign: 'center' },
  confirm: { color: '#edeef0', fontSize: 18, fontWeight: '700' },
  confirmSub: { color: '#5a6066', fontSize: 13, marginTop: 8 },
});
