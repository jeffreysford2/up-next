import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Bucket, Movie } from '../types';
import MoviePoster from './MoviePoster';
import SwipeHintOverlay from './SwipeHintOverlay';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const CARD_WIDTH = SCREEN_WIDTH * 0.88;
export const CARD_HEIGHT = SCREEN_HEIGHT * 0.64;

// How far the card must travel to commit to a swipe
const X_THRESHOLD = 120;
const Y_THRESHOLD = 120;

function getDirection(dx: number, dy: number): Bucket | null {
  'worklet';
  if (dx > X_THRESHOLD && dy > Y_THRESHOLD) return 'loved';
  if (dx > X_THRESHOLD) return 'liked';
  if (dx < -X_THRESHOLD) return 'disliked';
  if (dy > Y_THRESHOLD) return 'unseen';
  return null;
}

type Props = {
  movie: Movie;
  onSwiped: (movie: Movie, bucket: Bucket) => void;
};

export default function SwipeCard({ movie, onSwiped }: Props) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      const dir = getDirection(e.translationX, e.translationY);
      if (dir !== null) {
        const targets: Record<Bucket, { x: number; y: number }> = {
          loved: { x: SCREEN_WIDTH * 1.5, y: SCREEN_HEIGHT },
          liked: { x: SCREEN_WIDTH * 1.5, y: e.translationY },
          disliked: { x: -SCREEN_WIDTH * 1.5, y: e.translationY },
          unseen: { x: e.translationX, y: SCREEN_HEIGHT * 1.5 },
        };
        const t = targets[dir];
        translateX.value = withTiming(t.x, { duration: 280 });
        translateY.value = withTiming(t.y, { duration: 280 }, () => {
          runOnJS(onSwiped)(movie, dir);
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
      // Tilt follows horizontal drag; caps at ±15°
      { rotate: `${Math.max(-15, Math.min(15, translateX.value * 0.07))}deg` },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <MoviePoster uri={movie.poster_url} width={CARD_WIDTH} height={CARD_HEIGHT * 0.82} />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {movie.title}
          </Text>
          {movie.year != null && <Text style={styles.year}>{movie.year}</Text>}
        </View>
        <SwipeHintOverlay translateX={translateX} translateY={translateY} />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
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
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: 15,
    fontWeight: '500',
  },
});
