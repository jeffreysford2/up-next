import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useRatingsStore } from '../store/ratingsStore';
import { useTheme } from '../hooks/useTheme';

const ACCENT = '#6366f1';

// Tabs in the order they appear in the bottom bar
const ALL_TABS = ['Discover', 'Rate', 'Compare', 'Stats'];

const FEATURES = [
  {
    tab: 'Rate',
    headline: 'Start with what you know',
    body: "Swipe through movies and sort them into Loved, Liked, or Disliked. Haven't seen it? Swipe it away. Every swipe teaches the app your taste.",
  },
  {
    tab: 'Compare',
    headline: 'Fine-tune your rankings',
    body: "Pick between two movies you've already rated. These head-to-head choices sharpen each movie's score from a rough bucket into a precise 1–10.",
  },
  {
    tab: 'Discover',
    headline: 'Get personalized picks',
    body: "Once you've rated a few films, Discover serves up movies similar to your favorites — one at a time, ready to rate or explore.",
  },
  {
    tab: 'Stats',
    headline: 'See your taste at a glance',
    body: "Your full ranked list, score distribution, top genres, and more — a living snapshot of everything you've rated.",
  },
];

function MiniTabBar({ activeTab }: { activeTab: string }) {
  const c = useTheme();
  return (
    <View style={[styles.miniBar, { backgroundColor: c.surface, borderColor: c.divider }]}>
      {ALL_TABS.map((tab) => {
        const active = tab === activeTab;
        return (
          <View key={tab} style={styles.miniTab}>
            <View
              style={[
                styles.miniIndicator,
                { backgroundColor: active ? ACCENT : 'transparent' },
              ]}
            />
            <Text
              style={[
                styles.miniLabel,
                active ? styles.miniLabelActive : { color: c.textDim, fontSize: 10 },
              ]}
            >
              {tab}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const markOnboardingComplete = useRatingsStore((s) => s.markOnboardingComplete);
  const c = useTheme();

  function handleStart() {
    markOnboardingComplete();
    router.replace('/(tabs)/rate');
  }

  return (
    <View style={[styles.outer, { backgroundColor: c.bg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.appName, { color: c.text }]}>Up Next</Text>
          <Text style={[styles.tagline, { color: c.textFaint }]}>
            Your personal movie rankings, built one swipe at a time.
          </Text>
        </View>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.tab} style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
              <MiniTabBar activeTab={f.tab} />
              <View style={styles.cardBody}>
                <Text style={[styles.cardHeadline, { color: c.text }]}>{f.headline}</Text>
                <Text style={[styles.cardText, { color: c.textFaint }]}>{f.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: c.bg, borderTopColor: c.divider }]}>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={handleStart}
        >
          <Text style={styles.buttonText}>Let's go</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 24,
    gap: 32,
  },
  header: {
    gap: 10,
  },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    lineHeight: 24,
  },
  features: {
    gap: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  cardBody: {
    padding: 16,
    gap: 6,
  },
  cardHeadline: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
  },
  miniBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  miniTab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 6,
    paddingTop: 0,
  },
  miniIndicator: {
    width: '60%',
    height: 2,
    borderRadius: 2,
    marginBottom: 5,
  },
  miniLabel: {
    fontWeight: '700',
    textAlign: 'center',
  },
  miniLabelActive: {
    fontSize: 12,
    color: '#fff',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  button: {
    backgroundColor: ACCENT,
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
