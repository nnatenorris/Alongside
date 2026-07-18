import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createShare, CreateShareResponse } from '../api/shares';

export default function ComposerScreen() {
  const [sourceUrl, setSourceUrl] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateShareResponse | null>(null);

  const onSend = async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const share = await createShare({ sourceUrl, recipientPhone });
      setResult(share);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <View style={styles.content}>
          <Text style={styles.heading}>Send a clip</Text>

          <Text style={styles.label}>YouTube link</Text>
          <TextInput
            style={styles.input}
            placeholder="https://youtu.be/..."
            placeholderTextColor="#5a6066"
            autoCapitalize="none"
            autoCorrect={false}
            value={sourceUrl}
            onChangeText={setSourceUrl}
          />

          <Text style={styles.label}>Send to (phone number)</Text>
          <TextInput
            style={styles.input}
            placeholder="+1 555 555 5555"
            placeholderTextColor="#5a6066"
            keyboardType="phone-pad"
            value={recipientPhone}
            onChangeText={setRecipientPhone}
          />

          <Pressable
            style={[
              styles.button,
              (!sourceUrl || loading) && styles.buttonDisabled,
            ]}
            disabled={!sourceUrl || loading}
            onPress={onSend}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send for a reaction</Text>
            )}
          </Pressable>

          {error && <Text style={styles.error}>{error}</Text>}

          {result && (
            <View style={styles.result}>
              <Text style={styles.resultTitle}>{result.title}</Text>
              <Text style={styles.resultLink}>{result.share_link}</Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b0d10' },
  flex: { flex: 1 },
  content: { flex: 1, padding: 20, justifyContent: 'center' },
  heading: {
    color: '#edeef0',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 24,
  },
  label: { color: '#9aa0a6', fontSize: 12, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: '#15181c',
    borderColor: '#ffffff17',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#edeef0',
    fontSize: 15,
  },
  button: {
    backgroundColor: '#ff4433',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  error: { color: '#e0568c', marginTop: 16 },
  result: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1b1f24',
    borderWidth: 1,
    borderColor: '#ffffff17',
  },
  resultTitle: { color: '#edeef0', fontWeight: '700', marginBottom: 4 },
  resultLink: { color: '#4de8c7', fontFamily: 'monospace' },
});
