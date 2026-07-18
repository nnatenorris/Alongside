import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useVideoOutput,
  type Recorder,
} from 'react-native-vision-camera';

export interface ReactionCameraHandle {
  start: (maxDurationSeconds: number) => Promise<void>;
  stop: () => void;
}

// Reports every way a recording can end — an explicit stop() call, or the
// native maxDuration cap being hit — so the caller has one place to react.
export interface ReactionCameraProps {
  onFinished: (filePath: string | null) => void;
}

const ReactionCamera = forwardRef<ReactionCameraHandle, ReactionCameraProps>(
  ({ onFinished }, ref) => {
    const device = useCameraDevice('front');
    const videoOutput = useVideoOutput({ enableAudio: true });
    const recorderRef = useRef<Recorder | null>(null);

    useImperativeHandle(ref, () => ({
      start: async maxDurationSeconds => {
        const recorder = await videoOutput.createRecorder({
          maxDuration: maxDurationSeconds,
        });
        recorderRef.current = recorder;
        await recorder.startRecording(
          filePath => onFinished(filePath),
          error => {
            console.error('Reaction recording error:', error);
            onFinished(null);
          },
        );
      },
      stop: () => {
        recorderRef.current?.stopRecording();
      },
    }));

    if (!device) {
      return null;
    }

    return (
      <View style={styles.bubble}>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          outputs={[videoOutput]}
          isActive
        />
      </View>
    );
  },
);

export default ReactionCamera;

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
});
