// react-native-vision-camera loads a native Nitro Modules binary at import
// time, which doesn't exist under Jest. This manual mock (auto-picked up by
// Jest for node_modules packages) stands in so screens that import it can
// still be smoke-tested.
module.exports = {
  Camera: () => null,
  useCameraDevice: () => null,
  useVideoOutput: () => ({
    createRecorder: async () => ({
      startRecording: async () => {},
      stopRecording: async () => {},
    }),
  }),
  useCameraPermission: () => ({
    hasPermission: true,
    requestPermission: async () => true,
  }),
  useMicrophonePermission: () => ({
    hasPermission: true,
    requestPermission: async () => true,
  }),
};
