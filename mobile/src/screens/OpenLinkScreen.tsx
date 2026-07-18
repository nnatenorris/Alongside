import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OpenLinkScreen({
  onToken,
}: {
  onToken: (token: string) => void;
}) {
  const [value, setValue] = useState('');

  const open = () => {
    const token = value.trim().split('/').filter(Boolean).pop();
    if (token) onToken(token);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.heading}>Open a link</Text>
        <Text style={styles.hint}>
          Dev-only stand-in for tapping a real SMS/Universal Link — paste the
          share link (or just its token) below.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="https://alongside.app/s/AB12xy"
          placeholderTextColor="#5a6066"
          autoCapitalize="none"
          autoCorrect={false}
          value={value}
          onChangeText={setValue}
        />
        <Pressable
          style={[styles.button, !value && styles.buttonDisabled]}
          disabled={!value}
          onPress={open}>
          <Text style={styles.buttonText}>Open</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b0d10' },
  content: { flex: 1, padding: 20, justifyContent: 'center' },
  heading: { color: '#edeef0', fontSize: 24, fontWeight: '800' },
  hint: { color: '#9aa0a6', fontSize: 13, marginTop: 10, lineHeight: 19 },
  input: {
    backgroundColor: '#15181c',
    borderColor: '#ffffff17',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#edeef0',
    fontSize: 15,
    marginTop: 20,
  },
  button: {
    backgroundColor: '#ff4433',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
