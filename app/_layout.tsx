import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Slot, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useRatingsStore } from '../store/ratingsStore';

export default function RootLayout() {
  const [isHydrated, setIsHydrated] = useState(false);
  const hydrate = useRatingsStore((s) => s.hydrate);
  const onboardingComplete = useRatingsStore((s) => s.onboardingComplete);
  const router = useRouter();

  useEffect(() => {
    hydrate().then(() => setIsHydrated(true));
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (!onboardingComplete) {
      router.replace('/onboarding');
    }
  }, [isHydrated, onboardingComplete]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <Slot />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
