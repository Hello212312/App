import { Linking, Platform } from 'react-native';
import * as StoreReview from 'expo-store-review';

// Fill in once the app has a live App Store listing. Until then, the iOS
// "Rate us" button falls back to opening the App Store search page.
const IOS_APP_STORE_ID = null; // e.g. '1234567890'
const ANDROID_PACKAGE = 'com.interny.app';

export function getStoreReviewUrl() {
  if (Platform.OS === 'ios') {
    return IOS_APP_STORE_ID
      ? `itms-apps://apps.apple.com/app/id${IOS_APP_STORE_ID}?action=write-review`
      : `https://apps.apple.com/search?term=interny`;
  }
  return `market://details?id=${ANDROID_PACKAGE}`;
}

export async function openStoreReview() {
  try {
    const url = getStoreReviewUrl();
    await Linking.openURL(url);
  } catch {
    // Best-effort: a dead link here shouldn't crash the app.
  }
}

// Best-effort native prompt (SKStoreReviewController / Play In-App Review).
// Both platforms throttle or silently no-op this depending on build channel
// and how many times it's already been shown, so it's never guaranteed to
// display, so callers should not rely on it as the sole review mechanism.
export async function requestNativeReview() {
  try {
    const isAvailable = await StoreReview.isAvailableAsync();
    if (!isAvailable) return;
    await StoreReview.requestReview();
  } catch {
    // Review prompts are best-effort: never let a StoreKit error surface.
  }
}

// Minimum engagement before we'll ever ask for a review.
const MIN_APP_OPENS = 4;
const MIN_DAYS_SINCE_FIRST_LAUNCH = 3;

export function shouldShowReviewPrompt(user) {
  if (!user || user.reviewRequested) return false;
  const opensOk = (user.appOpenCount || 0) >= MIN_APP_OPENS;
  const daysSinceInstall = user.firstLaunchAt
    ? (Date.now() - user.firstLaunchAt) / (1000 * 60 * 60 * 24)
    : 0;
  const timeOk = daysSinceInstall >= MIN_DAYS_SINCE_FIRST_LAUNCH;
  return opensOk && timeOk;
}
