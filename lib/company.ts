/**
 * Company info — these can be sourced from env or hardcoded here.
 * When you update legal docs, bump the version so existing users are re-prompted.
 */

export const COMPANY = {
  name: process.env.EXPO_PUBLIC_COMPANY_NAME ?? 'Cesta',
  email: process.env.EXPO_PUBLIC_COMPANY_EMAIL ?? 'support@cesta.app',
  privacyEmail: process.env.EXPO_PUBLIC_PRIVACY_EMAIL ?? 'privacy@cesta.app',
  address: process.env.EXPO_PUBLIC_COMPANY_ADDRESS ?? 'Your Company Address',
  website: process.env.EXPO_PUBLIC_WEBSITE ?? 'https://cesta.app',
};

// Bump these when content changes — users will be re-prompted to accept
export const LEGAL_VERSIONS = {
  privacy: '2026-05-12',
  terms: '2026-05-12',
};

// Minimum age to use the app (varies by jurisdiction; 13 = COPPA, 16 = GDPR-K strict)
export const MIN_AGE = 13;
