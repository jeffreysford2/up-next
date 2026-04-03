import { Pressable, StyleSheet, Text, View, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Movie } from '../types';
import MoviePoster from './MoviePoster';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const DISCOVER_CARD_WIDTH = SCREEN_WIDTH * 0.88;
export const DISCOVER_CARD_HEIGHT = SCREEN_HEIGHT * 0.68;

// Any directional swipe past this distance dismisses the card
const DISMISS_THRESHOLD = 100;

type Props = {
  movie: Movie;
  onDismiss: () => void;
  onRatePress: () => void;
  onPress?: () => void;
};

export default function DiscoverCard({ movie, onDismiss, onRatePress, onPress }: Props) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      const distance = Math.sqrt(e.translationX ** 2 + e.translationY ** 2);
      if (distance < 15 && onPress) {
        runOnJS(onPress)();
        return;
      }
      if (distance > DISMISS_THRESHOLD) {
        // Fly off in the direction of the swipe
        const scale = SCREEN_WIDTH / Math.max(Math.abs(e.translationX), 1);
        translateX.value = withTiming(e.translationX * scale, { duration: 250 });
        translateY.value = withTiming(e.translationY * scale, { duration: 250 }, () => {
          runOnJS(onDismiss)();
        });
      } else {
        translateX.value = withSpring(0, { damping: 18 });
        translateY.value = withSpring(0, { damping: 18 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${Math.max(-10, Math.min(10, translateX.value * 0.05))}deg` },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <MoviePoster
          uri={movie.poster_url}
          width={DISCOVER_CARD_WIDTH}
          height={DISCOVER_CARD_HEIGHT * 0.76}
          borderRadius={0}
        />

        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {movie.title}
            </Text>
            {movie.year != null && (
              <Text style={styles.year}>{movie.year}</Text>
            )}
          </View>
          {movie.genres.length > 0 && (
            <Text style={styles.genres} numberOfLines={1}>
              {movie.genres.slice(0, 3).join(' · ')}
            </Text>
          )}
        </View>

        <Pressable
          onPress={onRatePress}
          style={({ pressed }) => [styles.rateButton, pressed && styles.rateButtonPressed]}
        >
          <Text style={styles.rateButtonText}>Rate this</Text>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    width: DISCOVER_CARD_WIDTH,
    height: DISCOVER_CARD_HEIGHT,
    borderRadius: 16,
    backgroundColor: '#1c1c1e',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  info: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  year: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  genres: {
    color: '#64748b',
    fontSize: 13,
  },
  rateButton: {
    marginHorizontal: 16,
    marginBottom: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    alignItems: 'center',
  },
  rateButtonPressed: {
    opacity: 0.7,
  },
  rateButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
});
