import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL, type CustomerInfo, type PurchasesOffering,
} from 'react-native-purchases';

const ENTITLEMENT_ID = 'pro';
let configured = false;

export async function configureRC(userId: string): Promise<void> {
  if (configured) { await Purchases.logIn(userId); return; }
  const apiKey = Platform.select({
    ios: process.env.EXPO_PUBLIC_RC_IOS,
    android: process.env.EXPO_PUBLIC_RC_ANDROID,
  });
  if (!apiKey) { console.warn('[rc] No API key'); return; }
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.WARN);
  else Purchases.setLogLevel(LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey, appUserID: userId });
  configured = true;
}

export async function logoutRC(): Promise<void> {
  if (!configured) return;
  try { await Purchases.logOut(); } catch (e) { console.warn('[rc]', e); }
}

export async function getCustomer(): Promise<CustomerInfo | null> {
  if (!configured) return null;
  try { return await Purchases.getCustomerInfo(); } catch (e) { return null; }
}

export function isPro(info: CustomerInfo | null | undefined): boolean {
  if (!info) return false;
  return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
}

export async function getOffering(): Promise<PurchasesOffering | null> {
  if (!configured) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch { return null; }
}

export async function startTrialOrPurchase(): Promise<{ success: boolean; cancelled: boolean; error?: string }> {
  if (!configured) return { success: false, cancelled: false, error: 'Subscriptions unavailable' };
  try {
    const offering = await getOffering();
    const pkg = offering?.annual ?? offering?.availablePackages?.[0];
    if (!pkg) return { success: false, cancelled: false, error: 'No subscription package available' };
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { success: isPro(customerInfo), cancelled: false };
  } catch (e: any) {
    if (e?.userCancelled) return { success: false, cancelled: true };
    return { success: false, cancelled: false, error: e?.message ?? 'Purchase failed' };
  }
}

export async function restorePurchases(): Promise<boolean> {
  if (!configured) return false;
  try { const info = await Purchases.restorePurchases(); return isPro(info); }
  catch { return false; }
}
