import React from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette, spacing, font } from '@/lib/theme';
import { COMPANY, LEGAL_VERSIONS } from '@/lib/company';

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h1}>Terms & Conditions</Text>
        <Text style={styles.meta}>Last updated: {LEGAL_VERSIONS.terms} · Version {LEGAL_VERSIONS.terms}</Text>

        <Text style={styles.p}>
          These Terms govern your use of the Cesta mobile application (the "App") provided by{' '}
          {COMPANY.name} ("we", "our", "us"). By creating an account or using the App, you agree
          to these Terms. If you don't agree, please don't use the App.
        </Text>

        <Text style={styles.h2}>1. Eligibility</Text>
        <Text style={styles.p}>
          You must be at least 13 years old (or 16 in some EEA countries) to use Cesta. If you are
          under the age of majority in your country, you confirm a parent or legal guardian has
          reviewed these Terms.
        </Text>

        <Text style={styles.h2}>2. Your account</Text>
        <Text style={styles.p}>
          You're responsible for keeping your password secure and for activity on your account.
          Tell us at {COMPANY.email} if you suspect unauthorized use. You may not share your
          account or use the App on behalf of another person without permission.
        </Text>

        <Text style={styles.h2}>3. Subscriptions and free trial</Text>
        <Text style={styles.p}>
          Cesta offers a paid subscription (Cesta Pro). When you start a free trial, your
          subscription begins at the end of the trial period and renews automatically unless you
          cancel at least 24 hours before the end of the current period.
        </Text>
        <Text style={styles.p}>
          Subscriptions are managed by Apple App Store or Google Play. You can review, manage, or
          cancel anytime in your App Store / Play Store account settings. Uninstalling the App does
          not cancel your subscription.
        </Text>
        <Text style={styles.p}>
          Refunds are handled by the App Store or Play Store per their published policies. We
          cannot directly issue refunds for in-app subscriptions.
        </Text>

        <Text style={styles.h2}>4. Acceptable use</Text>
        <Text style={styles.p}>
          You agree not to:{'\n'}
          • Reverse-engineer, decompile, or extract our source code.{'\n'}
          • Scrape, mass-download, or redistribute our content.{'\n'}
          • Use bots, scripts, or other automated means to interact with the App.{'\n'}
          • Use the App to harass, defraud, or harm anyone.{'\n'}
          • Circumvent or attempt to circumvent paywalls or technical restrictions.{'\n'}
          • Upload viruses, malware, or any harmful code.
        </Text>

        <Text style={styles.h2}>5. Our intellectual property</Text>
        <Text style={styles.p}>
          The App, including all lessons, audio, text, images, code, branding, and UI, is the
          property of {COMPANY.name} or its licensors and is protected by copyright and trademark
          laws. We grant you a personal, non-transferable, non-exclusive licence to use the App
          for your own learning. No other rights are granted.
        </Text>

        <Text style={styles.h2}>6. User content</Text>
        <Text style={styles.p}>
          If you submit any feedback, suggestions, or content (e.g. profile name, profile picture),
          you grant us a worldwide, royalty-free licence to use it to operate and improve the App.
          You confirm you have all rights necessary to submit such content.
        </Text>

        <Text style={styles.h2}>7. Termination</Text>
        <Text style={styles.p}>
          You can delete your account anytime from Profile › Privacy › Delete account. We may
          suspend or terminate your account if you breach these Terms, abuse the service, or as
          required by law. We'll give reasonable notice unless doing so would cause harm or is
          impractical.
        </Text>

        <Text style={styles.h2}>8. Disclaimers</Text>
        <Text style={styles.p}>
          THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS
          OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
          OR NON-INFRINGEMENT. WE DO NOT GUARANTEE THE APP WILL BE UNINTERRUPTED, ERROR-FREE, OR
          THAT CONTENT WILL ALWAYS BE ACCURATE.
        </Text>

        <Text style={styles.h2}>9. Limitation of liability</Text>
        <Text style={styles.p}>
          To the maximum extent permitted by law, {COMPANY.name} and its affiliates are not liable
          for any indirect, incidental, special, consequential, or punitive damages, or any loss of
          profits, revenue, data, or use, arising out of or related to your use of the App. Our
          total liability for any claim is limited to the amount you paid us in the 12 months
          before the claim.
        </Text>
        <Text style={styles.p}>
          Nothing in these Terms limits liability that cannot be limited by law, including liability
          for death, personal injury caused by negligence, or fraud.
        </Text>

        <Text style={styles.h2}>10. Indemnification</Text>
        <Text style={styles.p}>
          You agree to indemnify and hold us harmless from any claim, loss, damage, or expense
          arising from your breach of these Terms or your misuse of the App.
        </Text>

        <Text style={styles.h2}>11. Governing law</Text>
        <Text style={styles.p}>
          These Terms are governed by the laws of the jurisdiction where {COMPANY.name} is
          established. Disputes will be resolved in the competent courts of that jurisdiction,
          except where local consumer law gives you the right to sue in your home country.
        </Text>

        <Text style={styles.h2}>12. Changes to these Terms</Text>
        <Text style={styles.p}>
          We may update these Terms from time to time. Material changes will be notified in the App
          and require your acceptance before continued use.
        </Text>

        <Text style={styles.h2}>13. Apple-specific terms</Text>
        <Text style={styles.p}>
          If you obtained the App from the Apple App Store: these Terms are between you and{' '}
          {COMPANY.name}, not Apple. Apple has no obligation to provide maintenance or support.
          Apple is a third-party beneficiary of these Terms and may enforce them against you. The
          App is licensed for use as set out in the Apple Media Services Terms and Conditions.
        </Text>

        <Text style={styles.h2}>14. Google-specific terms</Text>
        <Text style={styles.p}>
          If you obtained the App from Google Play: your use is also governed by the Google Play
          Terms of Service. Google is not responsible for the App.
        </Text>

        <Text style={styles.h2}>15. Contact</Text>
        <Text style={styles.p}>
          Questions? Email {COMPANY.email} or write to {COMPANY.address}.
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
