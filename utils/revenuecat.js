// utils/revenuecat.js
// RevenueCat wraps StoreKit (iOS) / Play Billing (Android) so the Premium
// unlock goes through Apple/Google in-app purchase instead of a raw web
// checkout, because Apple requires this for unlocking digital app features.
//
// IMPORTANT: the RevenueCat SDK is a native module. It does not run inside
// Expo Go, so you need a custom dev build (`eas build --profile development`
// or `npx expo run:ios` / `run:android`) to test purchases on a device.
//
// One-time setup required in the RevenueCat dashboard (app.revenuecat.com)
// before any of this works:
//   1. Create a RevenueCat project, add an iOS app and an Android app.
//   2. In App Store Connect, create a Non-Consumable in-app purchase (e.g.
//      product id "premium_lifetime") priced at $8, and the matching
//      managed product in Google Play Console. Import both into RevenueCat.
//   3. In RevenueCat, create an Entitlement called "premium" and attach both
//      store products to it.
//   4. Create an Offering with a Package that offers the premium product.
//   5. Copy the iOS and Android "Public app-specific API keys" from
//      RevenueCat > Project settings > API keys, and set them as
//      EXPO_PUBLIC_REVENUECAT_IOS_KEY / EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
//      (e.g. in a .env file read by app.config, or as EAS secrets).
//   6. Add a webhook (Project settings > Integrations > Webhooks) pointing
//      at your deployed revenuecat-webhook edge function, with an
//      Authorization header value matching REVENUECAT_WEBHOOK_SECRET set on
//      that function: this is what keeps premium_devices (used server-side
//      by gemini-chat and essay review) in sync.

import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

export const ENTITLEMENT_ID = 'premium';

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';

let configured = false;

/**
 * Call once at app startup (see UserContext). appUserId is our existing
 * per-device UUID (utils/premium.getDeviceId) so purchases tie back to the
 * same id the rest of the app already uses for premium_devices.
 */
export async function initPurchases(appUserId) {
  if (configured) return true;
  const apiKey = Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY;
  if (!apiKey) {
    console.warn('[revenuecat] No API key configured (EXPO_PUBLIC_REVENUECAT_IOS_KEY / _ANDROID_KEY); purchases are disabled.');
    return false;
  }
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.WARN);
  Purchases.configure({ apiKey, appUserID: appUserId });
  configured = true;
  return true;
}

export function hasPremiumEntitlement(customerInfo) {
  return Boolean(customerInfo?.entitlements?.active?.[ENTITLEMENT_ID]);
}

/** Returns the current CustomerInfo, or null if purchases isn't configured/reachable. */
export async function fetchCustomerInfo() {
  if (!configured) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch (e) {
    console.warn('[revenuecat] getCustomerInfo failed:', e.message);
    return null;
  }
}

/** Fetches the current offering's first package (the Premium unlock). */
export async function getPremiumPackage() {
  if (!configured) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current?.availablePackages?.[0] || null;
  } catch (e) {
    console.warn('[revenuecat] getOfferings failed:', e.message);
    return null;
  }
}

/** Purchases the given package. Returns { ok, cancelled, error, customerInfo }. */
export async function purchasePremiumPackage(pkg) {
  if (!configured) return { ok: false, error: 'Purchases not configured' };
  if (!pkg) return { ok: false, error: 'No package to purchase' };
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { ok: hasPremiumEntitlement(customerInfo), customerInfo };
  } catch (e) {
    if (e.userCancelled) return { ok: false, cancelled: true };
    return { ok: false, error: e.message };
  }
}

/** Restores a previous purchase: used on reinstall / new device, same store account. */
export async function restorePurchases() {
  if (!configured) return { ok: false, error: 'Purchases not configured' };
  try {
    const customerInfo = await Purchases.restorePurchases();
    return { ok: hasPremiumEntitlement(customerInfo), customerInfo };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
