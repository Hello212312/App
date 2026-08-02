import { Tabs, useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { Platform, ScrollView } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  // Track scroll refs for each tab to enable scroll-to-top on tab press
  const homeScrollRef = useRef<ScrollView>(null);
  const exploreScrollRef = useRef<ScrollView>(null);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        // Scroll to top when tapping an already-active tab (like native iOS)
        tabBarOnPress: ({ route, preventDefault }) => {
          // Allow default navigation behavior
          if (preventDefault) {
            preventDefault();
          }
          const currentRoute = route.name;
          if (currentRoute === 'index' && homeScrollRef.current) {
            homeScrollRef.current.scrollTo({ y: 0, animated: true });
          } else if (currentRoute === 'explore' && exploreScrollRef.current) {
            exploreScrollRef.current.scrollTo({ y: 0, animated: true });
          }
          router.push({
            pathname: `/(tabs)/${currentRoute}`,
          } as any);
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
