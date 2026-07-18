import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useCameraPermission,
  useMicrophonePermission,
} from 'react-native-vision-camera';
import YouTubePlayer, { PlayerEvent } from '../components/YouTubePlayer';
import ReactionCamera, {
  ReactionCameraHandle,
} from '../components/ReactionCamera';
import {
  completeReaction,
  initReactionUpload,
  uploadReactionFile,
} from '../api/reactions';

const HARD_CAP_SECONDS = 30;

type Phase =
  | 'requesting_permission'
  | 'permission_denied'
  | 'ready'
  | 'recording'
  | 'uploading'
  | 'done'
  | 'error';

export default function ReactionCaptureScreen({
  shareId,
  videoId,
  startSeconds,
}: {
  shareId: string;
  videoId: string;
  startSeconds: number;
}) {
  const {
    hasPermission: hasCameraPermission,
    requestPermission: requestCameraPermission,
  } = useCameraPermission();
  const {
    hasPermission: hasMicPermission,
    requestPermission: requestMicPermission,
  } = useMicrophonePermission();

  const [phase, setPhase] = useState<Phase>('requesting_permission');
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<ReactionCameraHandle>(null);
  const capturedFromRef = useRef<number>(startSeconds);
  const finishingRef = useRef(false);

  useEffect(() => {
    (async () => {
      const cam = hasCameraPermission || (await requestCameraPermission());
      const mic = hasMicPermission || (await requestMicPermission());
      setPhase(cam && mic ? 'ready' : 'permission_denied');
    })();
    // Only run once on mount — re-requesting on every permission-hook
    // re-render would loop if the user denies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRecordingFinished = (path: string | null) => {
    if (finishingRef.current) return;
    finishingRef.current = true;

    if (!path) {
      setError('The recording did not save.');
      setPhase('error');
      return;
    }
    void uploadRecording(path);
  };

  const uploadRecording = async (path: string) => {
    setPhase('uploading');
    try {
      const { upload_url } = await initReactionUpload(shareId);
      await uploadReactionFile(upload_url, path);
      await completeReaction(shareId, {
        capturedFrom: capturedFromRef.current,
        duration: HARD_CAP_SECONDS,
      });
      setPhase('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The upload failed.');
      setPhase('error');
    }
  };

  const onPlayerEvent = (event: PlayerEvent) => {
    if (event.type === 'START_CAPTURE' && phase === 'ready') {
      capturedFromRef.current = event.atSeconds;
      finishingRef.current = false;
      setPhase('recording');
      void cameraRef.current?.start(HARD_CAP_SECONDS);
    }
    if (event.type === 'STOP_CAPTURE' && phase === 'recording') {
      cameraRef.current?.stop();
    }
  };

  if (phase === 'permission_denied') {
    return (
      <SafeAreaView style={[styles.screen, styles.centered]}>
        <Text style={styles.error}>
          Camera and microphone access are needed to record a reaction. You
          can still watch — just without sending one back.
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

  if (phase === 'done') {
    return (
      <SafeAreaView style={[styles.screen, styles.centered]}>
        <Text style={styles.confirm}>Sent — thanks!</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <YouTubePlayer
        videoId={videoId}
        startSeconds={startSeconds}
        onEvent={onPlayerEvent}
      />
      {(phase === 'ready' || phase === 'recording') && (
        <ReactionCamera ref={cameraRef} onFinished={onRecordingFinished} />
      )}
      {phase === 'uploading' && (
        <View style={styles.uploading}>
          <Text style={styles.uploadingText}>Sending your reaction…</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b0d10' },
  centered: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  error: { color: '#e0568c', fontSize: 15, textAlign: 'center' },
  confirm: { color: '#edeef0', fontSize: 18, fontWeight: '700' },
  uploading: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  uploadingText: { color: '#9aa0a6', fontSize: 13 },
});
