import { Pressable, StyleSheet, Text, View, Dimensions } from 'react-native';
import { Movie } from '../types';
import MoviePoster from './MoviePoster';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const COMPARE_CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;
export const COMPARE_CARD_HEIGHT = COMPARE_CARD_WIDTH * 1.6;

type Props = {
  movie: Movie;
  onPress: () => void;
};

export default function CompareCard({ movie, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <MoviePoster
        uri={movie.poster_url}
        width={COMPARE_CARD_WIDTH}
        height={COMPARE_CARD_HEIGHT * 0.84}
        borderRadius={12}
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {movie.title}
        </Text>
        {movie.year != null && (
          <Text style={styles.year}>{movie.year}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: COMPARE_CARD_WIDTH,
    height: COMPARE_CARD_HEIGHT,
    borderRadius: 12,
    backgroundColor: '#1c1c1e',
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
  info: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  year: {
    color: '#94a3b8',
    fontSize: 12,
  },
});
