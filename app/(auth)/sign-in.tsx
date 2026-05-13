import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Pressable, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { palette, spacing, font, radius } from '@/lib/theme';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) { Alert.alert('Missing info', 'Please enter email and password.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert('Sign in failed', error.message);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.logo}>Cesta</Text>
          <Text style={styles.tagline}>Czech, from zero to B1.</Text>
          <View style={styles.form}>
            <TextInput placeholder="Email" placeholderTextColor={palette.inkFaint}
              autoCapitalize="none" autoCorrect={false} keyboardType="email-address"
              value={email} onChangeText={setEmail} style={styles.input} />
            <TextInput placeholder="Password" placeholderTextColor={palette.inkFaint}
              secureTextEntry value={password} onChangeText={setPassword} style={styles.input} />
            <Button label="Sign in" variant="primary" size="lg" onPress={handleSignIn} loading={loading} />
            <Pressable onPress={() => router.push('/(auth)/sign-up')}>
              <Text style={styles.linkText}>New here? <Text style={styles.linkStrong}>Create an account</Text></Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.surface },
  content: { flexGrow: 1, padding: spacing.xl, justifyContent: 'center', gap: spacing.xl },
  logo: { fontSize: 56, fontWeight: font.weight.extrabold, color: palette.primary, textAlign: 'center', letterSpacing: -1 },
  tagline: { fontSize: font.size.lg, color: palette.inkMuted, textAlign: 'center', marginTop: -spacing.md },
  form: { gap: spacing.md, marginTop: spacing.xl },
  input: { backgroundColor: palette.surfaceRaised, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, padding: spacing.lg, fontSize: font.size.md, color: palette.ink },
  linkText: { textAlign: 'center', color: palette.inkMuted, fontSize: font.size.md, marginTop: spacing.md },
  linkStrong: { color: palette.primary, fontWeight: font.weight.bold },
});
