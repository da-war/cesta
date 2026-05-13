import React from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette, spacing, font } from '@/lib/theme';
import { COMPANY, LEGAL_VERSIONS } from '@/lib/company';

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h1}>Privacy Policy</Text>
        <Text style={styles.meta}>Last updated: {LEGAL_VERSIONS.privacy} · Version {LEGAL_VERSIONS.privacy}</Text>

        <Text style={styles.p}>
          {COMPANY.name} ("we", "our", "us") respects your privacy. This Privacy Policy explains what
          information we collect about you when you use the Cesta mobile application (the "App"),
          why we collect it, how we use it, and the choices you have. By using the App, you agree
          to this policy.
        </Text>

        <Text style={styles.h2}>1. Who is the data controller?</Text>
        <Text style={styles.p}>
          The data controller is {COMPANY.name}, contactable at {COMPANY.privacyEmail}.
          For mailing, our address is {COMPANY.address}.
        </Text>

        <Text style={styles.h2}>2. What we collect</Text>
        <Text style={styles.p}><Text style={styles.b}>Account information.</Text> Email address, password (hashed — we never see the plain text), display name (optional), and avatar URL (optional).</Text>
        <Text style={styles.p}><Text style={styles.b}>Learning data.</Text> Your CEFR placement result, completed lessons, XP, streak history, daily activity, spaced-repetition state, hearts, daily goal preference, and subscription status.</Text>
        <Text style={styles.p}><Text style={styles.b}>Device & technical data.</Text> Operating system version, app version, device model, language and timezone settings, anonymous crash reports, and aggregated performance metrics (only if you consented to analytics).</Text>
        <Text style={styles.p}><Text style={styles.b}>Subscription data.</Text> Managed by RevenueCat and the App Store / Play Store. We receive an opaque user identifier and entitlement status. We do not see or store your full payment card details.</Text>
        <Text style={styles.p}><Text style={styles.b}>Consent log.</Text> A record of when you accepted the Terms, Privacy Policy, marketing emails, analytics, and tracking, so we can prove your consent if asked by regulators.</Text>

        <Text style={styles.h2}>3. What we do NOT collect</Text>
        <Text style={styles.p}>
          We do not collect your real name (unless you provide it), date of birth (we only ask if you
          are over our minimum age), location data, contacts, photos, files, browsing history outside
          the App, or any data from other apps.
        </Text>

        <Text style={styles.h2}>4. How we use your data</Text>
        <Text style={styles.p}>
          • To provide and personalise the App (saving your progress, scheduling reviews, building
          your roadmap).{'\n'}
          • To process subscriptions through the App Store / Play Store and RevenueCat.{'\n'}
          • To send streak reminders and educational notifications (only if you enable them).{'\n'}
          • To improve the App — fix bugs, plan content, identify confusing lessons (only with analytics consent).{'\n'}
          • To send occasional product updates by email (only if you opt-in to marketing).{'\n'}
          • To comply with legal obligations (e.g. tax records, fraud prevention).
        </Text>

        <Text style={styles.h2}>5. Legal basis (GDPR)</Text>
        <Text style={styles.p}>
          • <Text style={styles.b}>Contract</Text> — to deliver the App and subscription you signed up for.{'\n'}
          • <Text style={styles.b}>Consent</Text> — for optional marketing, analytics, and tracking.{'\n'}
          • <Text style={styles.b}>Legitimate interest</Text> — for fraud prevention and product security.{'\n'}
          • <Text style={styles.b}>Legal obligation</Text> — for tax and regulatory compliance.
        </Text>

        <Text style={styles.h2}>6. Sharing with third parties</Text>
        <Text style={styles.p}>
          We do not sell your personal data. We share limited data with these processors who help us run the App:
        </Text>
        <Text style={styles.p}>
          • <Text style={styles.b}>Supabase</Text> (database & authentication) — stores your account and learning data.{'\n'}
          • <Text style={styles.b}>RevenueCat</Text> (subscription management) — receives anonymous user IDs to verify entitlements.{'\n'}
          • <Text style={styles.b}>Apple App Store / Google Play</Text> — handles payments and platform requirements.{'\n'}
          • <Text style={styles.b}>Expo Application Services</Text> — delivers app updates and crash reports.
        </Text>
        <Text style={styles.p}>
          Each processor is bound by data-processing agreements that require them to handle your
          data only on our instructions and to keep it secure.
        </Text>

        <Text style={styles.h2}>7. International transfers</Text>
        <Text style={styles.p}>
          Some of our processors are located in the United States. Where we transfer your personal
          data outside the European Economic Area, we rely on Standard Contractual Clauses approved
          by the European Commission.
        </Text>

        <Text style={styles.h2}>8. How long we keep your data</Text>
        <Text style={styles.p}>
          We keep your data while your account is active. If you request deletion, your account and
          all linked data are scheduled for permanent deletion within 30 days (or immediately, if you
          choose). Consent logs and limited financial records may be retained for up to 7 years
          where required by law.
        </Text>

        <Text style={styles.h2}>9. Your rights</Text>
        <Text style={styles.p}>
          Under GDPR, UK GDPR, CCPA and similar laws, you have the right to:
        </Text>
        <Text style={styles.p}>
          • <Text style={styles.b}>Access</Text> — export all your data from Profile › Privacy › Export my data.{'\n'}
          • <Text style={styles.b}>Rectification</Text> — edit your profile in the App.{'\n'}
          • <Text style={styles.b}>Erasure</Text> — delete your account from Profile › Privacy › Delete account.{'\n'}
          • <Text style={styles.b}>Restriction & objection</Text> — email {COMPANY.privacyEmail}.{'\n'}
          • <Text style={styles.b}>Portability</Text> — your data export is JSON, machine-readable.{'\n'}
          • <Text style={styles.b}>Withdraw consent</Text> — toggle marketing/analytics/tracking anytime in Profile › Privacy.{'\n'}
          • <Text style={styles.b}>Complain</Text> — to your local data protection authority.
        </Text>

        <Text style={styles.h2}>10. Children's privacy</Text>
        <Text style={styles.p}>
          The App is not directed to children under 13 (or under 16 in some EEA countries). We ask
          all users to confirm their age at signup. If we learn we've collected data from a child
          under our minimum age, we delete it.
        </Text>

        <Text style={styles.h2}>11. Tracking (iOS App Tracking Transparency)</Text>
        <Text style={styles.p}>
          On iOS, we ask for your permission before linking any device identifiers across apps for
          marketing or analytics purposes. You can change this anytime in iOS Settings › Privacy
          & Security › Tracking. Declining does not affect your ability to use the App.
        </Text>

        <Text style={styles.h2}>12. Security</Text>
        <Text style={styles.p}>
          We use TLS for all network traffic, hashed passwords, row-level security on the database,
          and least-privilege access controls. No system is perfectly secure — if you suspect a
          breach affecting your account, contact {COMPANY.privacyEmail} immediately.
        </Text>

        <Text style={styles.h2}>13. Changes to this policy</Text>
        <Text style={styles.p}>
          When we make material changes, we update the version date and re-prompt you to accept
          the new policy on next launch.
        </Text>

        <Text style={styles.h2}>14. Contact</Text>
        <Text style={styles.p}>
          Email: {COMPANY.privacyEmail}{'\n'}
          Address: {COMPANY.address}{'\n'}
          Website: {COMPANY.website}
        </Text>

        <Text style={styles.footer}>© {new Date().getFullYear()} {COMPANY.name}. All rights reserved.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.surface },
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxxl },
  h1: { fontSize: font.size.xxxl, fontWeight: font.weight.extrabold, color: palette.ink, marginBottom: spacing.xs },
  meta: { fontSize: font.size.sm, color: palette.inkMuted, marginBottom: spacing.lg },
  h2: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: palette.ink, marginTop: spacing.lg, marginBottom: spacing.xs },
  p: { fontSize: font.size.md, color: palette.inkSoft, lineHeight: 22, marginBottom: spacing.sm },
  b: { fontWeight: font.weight.bold, color: palette.ink },
  footer: { fontSize: font.size.xs, color: palette.inkMuted, textAlign: 'center', marginTop: spacing.xxl },
});
