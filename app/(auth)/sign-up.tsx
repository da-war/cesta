import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Pressable, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { palette, spacing, font, radius } from '@/lib/theme';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password) { Alert.alert('Missing info', 'Please enter email and password.'); return; }
    if (password.length < 8) { Alert.alert('Weak password', 'Use at least 8 characters.'); return; }
    if (!accepted) { Alert.alert('Required', 'Please agree to the Terms & Conditions and Privacy Policy.'); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { display_name: name || email.split('@')[0] } },
    });
    setLoading(false);
    if (error) { Alert.alert('Sign up failed', error.message); return; }
    if (data.session) router.replace('/(auth)/age-gate');
    else Alert.alert('Check your email', 'Confirm your email address to continue.');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.logo}>Cesta</Text>
          <Text style={styles.tagline}>Start learning Czech today</Text>
          <View style={styles.form}>
            <TextInput placeholder="Your name (optional)" placeholderTextColor={palette.inkFaint}
              autoCapitalize="words" value={name} onChangeText={setName} style={styles.input} />
            <TextInput placeholder="Email" placeholderTextColor={palette.inkFaint}
              autoCapitalize="none" autoCorrect={false} keyboardType="email-address"
              value={email} onChangeText={setEmail} style={styles.input} />
            <TextInput placeholder="Password (8+ characters)" placeholderTextColor={palette.inkFaint}
              secureTextEntry value={password} onChangeText={setPassword} style={styles.input} />

            <Pressable onPress={() => setAccepted((v) => !v)} style={styles.checkRow}>
              <View style={[styles.checkbox, accepted && styles.checkboxOn]}>
                {accepted && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <Text style={styles.checkText}>
                I agree to the{' '}
                <Text style={styles.checkLink} onPress={() => router.push('/legal/terms')}>Terms & Conditions</Text>{' '}
                and{' '}
                <Text style={styles.checkLink} onPress={() => router.push('/legal/privacy')}>Privacy Policy</Text>.
              </Text>
            </Pressable>

            <Button label="Create account" variant="primary" size="lg" onPress={handleSignUp} loading={loading} disabled={!accepted} />
            <Pressable onPress={() => router.back()}>
              <Text style={styles.linkText}>Already have an account? <Text style={styles.linkStrong}>Sign in</Text></Text>
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
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: spacing.sm },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: palette.border, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkboxOn: { backgroundColor: palette.primary, borderColor: palette.primary },
  checkMark: { color: '#fff', fontSize: 16, fontWeight: '900' },
  checkText: { flex: 1, fontSize: font.size.sm, color: palette.inkSoft, lineHeight: 20 },
  checkLink: { color: palette.primary, fontWeight: font.weight.semibold, textDecorationLine: 'underline' },
  linkText: { textAlign: 'center', color: palette.inkMuted, fontSize: font.size.md, marginTop: spacing.md },
  linkStrong: { color: palette.primary, fontWeight: font.weight.bold },
});
