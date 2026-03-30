import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Slot } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useRatingsStore } from '../store/ratingsStore';

export default function RootLayout() {
  const hydrate = useRatingsStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, []);

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
