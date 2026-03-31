import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useRatingsStore } from '../store/ratingsStore';

const STEPS = [
  {
    icon: '👆',
    title: 'Rate movies',
    body: 'Swipe through films and sort them into loved, liked, disliked, or haven't seen.',
  },
  {
    icon: '⚖️',
    title: 'Compare to rank',
    body: 'Pick between two movies you've rated. Your choices build a precise 1–10 score for each.',
  },
  {
    icon: '🎬',
    title: 'Discover new ones',
    body: 'We find movies similar to what you love and serve them one at a time.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const markOnboardingComplete = useRatingsStore((s) => s.markOnboardingComplete);

  function handleStart() {
    markOnboardingComplete();
    router.replace('/(tabs)/rate');
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>Up Next</Text>
        <Text style={styles.tagline}>Your personal movie rankings, built one swipe at a time.</Text>
      </View>

      <View style={styles.steps}>
        {STEPS.map((step) => (
          <View key={step.title} style={styles.step}>
            <Text style={styles.stepIcon}>{step.icon}</Text>
            <View style={styles.stepText}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepBody}>{step.body}</Text>
            </View>
          </View>
        ))}
      </View>

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={handleStart}
      >
        <Text style={styles.buttonText}>Start rating</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 48,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'flex-start',
  },
  appName: {
    color: '#fff',
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 12,
  },
  tagline: {
    color: '#64748b',
    fontSize: 16,
    lineHeight: 24,
  },
  steps: {
    gap: 28,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  stepIcon: {
    fontSize: 28,
    lineHeight: 34,
  },
  stepText: {
    flex: 1,
  },
  stepTitle: {
    color: '#e2e8f0',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  stepBody: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
