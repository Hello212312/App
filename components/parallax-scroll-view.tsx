// Add scroll-to-top capability
import { forwardRef, type PropsWithChildren, ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollOffset,
} from 'react-native-reanimated';

import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

const HEADER_HEIGHT = 250;

type Props = PropsWithChildren<{
  headerImage: ReactElement;
  headerBackgroundColor: { dark: string; light: string };
}>;

export type ParallaxScrollViewRef = {
  scrollTo: (options: { y?: number; animated?: boolean }) => void;
};

const ParallaxScrollView = forwardRef<ParallaxScrollViewRef, Props>(
  ({ children, headerImage, headerBackgroundColor }, ref) => {
    const backgroundColor = useThemeColor({}, 'background');
    const colorScheme = useColorScheme() ?? 'light';
    const scrollRef = useAnimatedRef<Animated.ScrollView>();
    const scrollOffset = useScrollOffset(scrollRef);
    const headerAnimatedStyle = useAnimatedStyle(() => {
      return {
        transform: [
          {
            translateY: interpolate(
              scrollOffset.value,
              [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
              [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75]
            ),
          },
          {
            scale: interpolate(scrollOffset.value, [-HEADER_HEIGHT, 0, HEADER_HEIGHT], [2, 1, 1]),
          },
        ],
      };
    });

    React.useImperativeHandle(ref, () => ({
      scrollTo: (options) => {
        if (scrollRef.current) {
          (scrollRef.current as any).scrollTo(options);
        }
      },
    }));

    return (
      <Animated.ScrollView
        ref={scrollRef}
        style={{ backgroundColor, flex: 1 }}
        scrollEventThrottle={16}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled">
        <Animated.View
          style={[
            styles.header,
            { backgroundColor: headerBackgroundColor[colorScheme] },
            headerAnimatedStyle,
          ]}>
          {headerImage}
        </Animated.View>
        <ThemedView style={styles.content}>{children}</ThemedView>
      </Animated.ScrollView>
    );
  }
);

ParallaxScrollView.displayName = 'ParallaxScrollView';