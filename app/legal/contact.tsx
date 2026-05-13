import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Application from 'expo-application';
import { Button } from '@/components/ui/Button';
import { palette, spacing, font, radius } from '@/lib/theme';
import { COMPANY } from '@/lib/company';
import { useProfile } from '@/lib/store';

const SUBJECTS = ['General question', 'Bug report', 'Subscription / billing', 'Privacy request', 'Feedback / suggestion', 'Other'];

export default function ContactScreen() {
  const profile = useProfile();
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [message, setMessage] = useState('');

  const handleSend = async () => {
    if (!message.trim()) { Alert.alert('Empty message', 'Please type your message before sending.'); return; }
    const body = encodeURIComponent(
      `${message}\n\n` +
      `--- Diagnostic info (helps us help you) ---\n` +
      `User ID: ${profile?.id ?? 'not signed in'}\n` +
      `App version: ${Application.nativeApplicationVersion ?? 'unknown'} (${Application.nativeBuildVersion ?? 'unknown'})\n` +
      `Platform: ${Platform.OS} ${Platform.Version}\n`
    );
    const mailUrl = `mailto:${COMPANY.email}?subject=${encodeURIComponent(`[Cesta] ${subject}`)}&body=${body}`;
    const canOpen = await Linking.canOpenURL(mailUrl);
    if (!canOpen) {
      Alert.alert(
        'Email app needed',
        `Please email us directly at ${COMPANY.email}. We typically respond within 2 business days.`
      );
      return;
    }
    await Linking.openURL(mailUrl);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.h1}>Contact Us</Text>
        <Text style={styles.body}>
          Need help or want to share feedback? We read every message and usually reply within 2 business days.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>What's it about?</Text>
          <View style={styles.subjectGrid}>
            {SUBJECTS.map((s) => (
              <Pressable
                key={s}
                onPress={() => setSubject(s)}
                style={[styles.subjectChip, subject === s && styles.subjectChipOn]}
              >
                <Text style={[styles.subjectText, subject === s && { color: '#fff' }]}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Your message</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Tell us what's on your mind…"
            placeholderTextColor={palette.inkFaint}
            multiline
            numberOfLines={6}
            style={styles.textarea}
            textAlignVertical="top"
          />
        </View>

        <Button label="Send via email" variant="primary" size="lg" onPress={handleSend} />

        <View style={styles.divider} />

        <Text style={styles.h2}>Other ways to reach us</Text>
        <ContactRow label="Support" value={COMPANY.email} onPress={() => Linking.openURL(`mailto:${COMPANY.email}`)} />
        <ContactRow label="Privacy" value={COMPANY.privacyEmail} onPress={() => Linking.openURL(`mailto:${COMPANY.privacyEmail}`)} />
        <ContactRow label="Website" value={COMPANY.website} onPress={() => Linking.openURL(COMPANY.website)} />
        <ContactRow label="Address" value={COMPANY.address} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ContactRow({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={styles.contactRow}>
      <Text style={styles.contactLabel}>{label}</Text>
      <Text style={[styles.contactValue, onPress && styles.contactLink]}>{value}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.surface },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  h1: { fontSize: font.size.xxxl, fontWeight: font.weight.extrabold, color: palette.ink },
  h2: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: palette.ink, marginTop: spacing.md },
  body: { fontSize: font.size.md, color: palette.inkMuted, lineHeight: 22 },
  card: { backgroundColor: palette.surfaceRaised, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: palette.border, gap: spacing.sm },
  label: { fontSize: font.size.sm, fontWeight: font.weight.bold, color: palette.inkSoft, marginBottom: spacing.xs },
  subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  subjectChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: palette.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: palette.border },
  subjectChipOn: { backgroundColor: palette.primary, borderColor: palette.primary },
  subjectText: { fontSize: font.size.sm, color: palette.ink, fontWeight: font.weight.medium },
  textarea: { backgroundColor: palette.surface, borderRadius: radius.md, padding: spacing.md, fontSize: font.size.md, color: palette.ink, borderWidth: 1, borderColor: palette.border, minHeight: 140 },
  divider: { height: 1, backgroundColor: palette.borderSoft, marginVertical: spacing.lg },
  contactRow: { paddingVertical: spacing.sm },
  contactLabel: { fontSize: font.size.xs, color: palette.inkMuted, fontWeight: font.weight.bold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  contactValue: { fontSize: font.size.md, color: palette.ink },
  contactLink: { color: palette.primary, textDecorationLine: 'underline' },
});
