import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRatingsStore } from '../store/ratingsStore';

export default function RootLayout() {
  const [isHydrated, setIsHydrated] = useState(false);
  const hydrate = useRatingsStore((s) => s.hydrate);
  const backfillMovieCache = useRatingsStore((s) => s.backfillMovieCache);
  const onboardingComplete = useRatingsStore((s) => s.onboardingComplete);
  const router = useRouter();

  useEffect(() => {
    hydrate().then(() => {
      setIsHydrated(true);
      backfillMovieCache(); // fetch any movies missing from cache in the background
    });
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (!onboardingComplete) {
      router.replace('/onboarding');
    }
  }, [isHydrated, onboardingComplete]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="movie/[id]" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
