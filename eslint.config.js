// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // app/, components/*.tsx, hooks/, constants/ are unused Expo template
    // leftovers (the live app is App.js + screens/); supabase/functions is
    // Deno code linted separately.
    ignores: [
      'dist/*',
      'app/**',
      'app-example/**',
      'components/**/*.tsx',
      'hooks/**',
      'constants/**',
      'scripts/**',
      'supabase/functions/**',
    ],
  },
  {
    rules: {
      // Apostrophes/quotes in JSX copy render fine in React Native — escaping
      // them everywhere is churn with no user-facing benefit.
      'react/no-unescaped-entities': 'off',
      // These flag standard RN idioms (useRef(new Animated.Value()).current,
      // the latest-ref pattern, modal state sync on `visible`). Keep them
      // visible as warnings, but don't let them drown out real errors.
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
]);
