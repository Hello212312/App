// utils/posthog.js
// Singleton PostHog client, shared between the PostHogProvider (App.js) and
// plain (non-component) call sites like utils/analytics.js and UserContext.js.

import Constants from 'expo-constants';
import { PostHog } from 'posthog-react-native';

const extra = Constants.expoConfig?.extra || {};

export const posthog = new PostHog(extra.posthogApiKey, {
  host: extra.posthogHost || 'https://us.i.posthog.com',
  enableSessionReplay: false,
});
