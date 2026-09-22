// App.js: Root navigator
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useRef } from 'react';
import { Linking, Platform, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PostHogProvider, useNavigationTracker } from 'posthog-react-native';
import PremiumTourOverlay from './components/PremiumTourOverlay';
import ReviewPromptModal from './components/ReviewPromptModal';
import { TourProvider } from './context/TourContext';
import { ONBOARDING_VERSION, UserProvider, useUser } from './context/UserContext';
import { INTERNSHIPS, loadInternships } from './data';
import { posthog } from './utils/posthog';

import ClosingSoonScreen from './screens/ClosingSoonScreen';
import DeadlinesScreen from './screens/DeadlinesScreen';
import DetailScreen from './screens/DetailScreen';
import HomeScreen from './screens/HomeScreen';
import MaterialsScreen from './screens/MaterialsScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import ProfileScreen from './screens/ProfileScreen';
import SavedScreen from './screens/SavedScreen';
import SearchScreen from './screens/SearchScreen';
import TrackerScreen from './screens/TrackerScreen';

import { Colors, Typography } from './theme';

// ─── ERROR BOUNDARY ─────────────────────────────────────────────────────

class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: Colors.background }}>
          <Text style={{ fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.textPrimary, marginBottom: 8 }}>
            Something went wrong
          </Text>
          <Text style={{ fontSize: Typography.size.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>
            Please restart Interny. If this keeps happening, reinstall the app.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// ─── NOTIFICATION HANDLER ─────────────────────────────────────────────────────
// SDK 54: shouldShowAlert is deprecated; use shouldShowBanner + shouldShowList instead.

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList:   true,
    shouldPlaySound:  true,
    shouldSetBadge:   false,
  }),
});

// Explicit channel creation, not just app.json's `defaultChannel` config,
// because the config plugin only takes effect on a fresh native prebuild.
// An existing dev/production build that predates it would otherwise route
// deadline reminders into Android's generic low-importance channel and
// never surface them.
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('deadlines', {
    name: 'Deadline reminders',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
  });
}

// ─── DEEP LINK / NOTIFICATION-TAP NAVIGATION ──────────────────────────────────
// Used by "closing soon" notifications (utils/notifications.js attaches
// data:{internshipId} to every one). INTERNSHIPS may still be loading on a
// cold start, so retry briefly rather than silently dropping the navigation.

function navigateToInternship(navRef, id, attempt = 0) {
  if (!id) return;
  const item = INTERNSHIPS.find((i) => i.id === id);
  if (item) {
    navRef.current?.navigate('Detail', { item });
  } else if (attempt < 10) {
    setTimeout(() => navigateToInternship(navRef, id, attempt + 1), 300);
  }
}

function parseInternshipIdFromUrl(url) {
  if (!url) return null;
  const match = url.match(/detail\/([^/?#]+)/i);
  return match ? match[1] : null;
}

// ─── NAVIGATORS ───────────────────────────────────────────────────────────────

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

const TAB_ICONS = {
  Home:      { focused: 'home',            unfocused: 'home-outline' },
  Search:    { focused: 'search',          unfocused: 'search-outline' },
  Tracker:   { focused: 'layers',          unfocused: 'layers-outline' },
  Profile:   { focused: 'person-circle',   unfocused: 'person-circle-outline' },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({route }) => ({
        headerShown: false,
        lazy: true,
        tabBarIcon: ({ focused, size }) => {
          const iconSet = TAB_ICONS[route.name] ?? { focused: 'ellipse', unfocused: 'ellipse-outline' };
          const iconName = focused ? iconSet.focused : iconSet.unfocused;
          return (
            <Ionicons
              name={iconName}
              size={size}
              color={focused ? Colors.accent : Colors.textTertiary}
            />
          );
        },
        tabBarActiveTintColor:   Colors.accent,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          backgroundColor: Colors.surface,
          paddingTop: 6,
          // NOTE: no hardcoded height/paddingBottom, because overriding them
          // prevents React Navigation from applying the bottom safe-area inset,
          // which makes the tab bar collide with the home indicator on Face ID iPhones.
        },
        tabBarLabelStyle: {
          fontSize: Typography.size.xs,
          fontWeight: Typography.weight.medium,
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      })}
    >
      <Tab.Screen name="Home"      component={HomeScreen} />
      <Tab.Screen name="Search"    component={SearchScreen} />
      <Tab.Screen name="Tracker"   component={TrackerScreen} />
      <Tab.Screen name="Profile"   component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ─── ROOT NAVIGATOR (inside UserProvider so it can read user state) ───────────

function RootNavigator() {
  const { user, loaded, setUser } = useUser();
  const navRef = useRef(null);

  // Autocaptures a PostHog "$screen" event on every navigation state change.
  useNavigationTracker(undefined, navRef, posthog);

  // NOTE: loadInternships / subscribeToInternships are handled in App() below
  // and in UserContext respectively. We no longer subscribe here or schedule
  // notifications here: UserContext is the single source of truth for that.

  // Increment open count. UserContext watches this (plus days since first
  // launch) to decide when to surface the review prompt.
  useEffect(() => {
    if (!loaded) return;
    setUser({ appOpenCount: (user.appOpenCount || 0) + 1 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // Once storage has loaded, route the user correctly.
  useEffect(() => {
    if (!loaded) return;
    // onboardingVersion must also match the current version: a bump forces
    // every existing user back through onboarding once, even if they'd
    // already finished it under an older version.
    if (user.onboardingDone && user.onboardingVersion === ONBOARDING_VERSION && navRef.current) {
      navRef.current.reset({ index: 0, routes: [{ name: 'Main' }] });
      // The first-launch feature tour auto-starts from TourContext once Main renders.
    }
  }, [loaded, user.onboardingDone, user.onboardingVersion]);

  // Tapping a "closing soon" notification opens that internship's detail card.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const id = response.notification.request.content.data?.internshipId;
      navigateToInternship(navRef, id);
    });
    Notifications.getLastNotificationResponseAsync().then((response) => {
      const id = response?.notification.request.content.data?.internshipId;
      navigateToInternship(navRef, id);
    });
    return () => sub.remove();
  }, []);

  // Deep link: interny://detail/<id>.
  useEffect(() => {
    Linking.getInitialURL().then((url) => navigateToInternship(navRef, parseInternshipIdFromUrl(url)));
    const sub = Linking.addEventListener('url', ({ url }) =>
      navigateToInternship(navRef, parseInternshipIdFromUrl(url))
    );
    return () => sub.remove();
  }, []);

  return (
    <TourProvider navRef={navRef}>
      <NavigationContainer ref={navRef}>
        <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: Platform.OS === 'web' ? {flex: 1, height: '100%', maxHeight: '100%', overflow: 'hidden'} : undefined }}>
          <Stack.Screen name="Onboarding"  component={OnboardingScreen} />
          <Stack.Screen name="Main"       component={MainTabs} />
          <Stack.Screen name="Detail"     component={DetailScreen} />
          <Stack.Screen name="Deadlines"    component={DeadlinesScreen} />
          <Stack.Screen name="ClosingSoon"   component={ClosingSoonScreen} />
          <Stack.Screen name="Saved"         component={SavedScreen} />
          <Stack.Screen name="Materials"  component={MaterialsScreen} />
        </Stack.Navigator>

        {/* Spotlight tours (feature tour after onboarding): auto-start from TourContext */}
        <PremiumTourOverlay />
        <ReviewPromptModal />
      </NavigationContainer>
    </TourProvider>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function App() {
  useEffect(() => {
    loadInternships(); // fire and forget, since screens update via subscribeToInternships
  }, []);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <PostHogProvider client={posthog} autocapture={{ captureTouches: true, captureScreens: false, captureLifecycleEvents: true }}>
          <UserProvider>
            <RootNavigator />
          </UserProvider>
        </PostHogProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
