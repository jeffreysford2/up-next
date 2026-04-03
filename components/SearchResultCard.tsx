import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Movie } from '../types';
import MoviePoster from './MoviePoster';
import { useTheme } from '../hooks/useTheme';

type Props = {
  movie: Movie;
  onPress: (movie: Movie) => void;
};

export default function SearchResultCard({ movie, onPress }: Props) {
  const c = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: c.border },
        pressed && { backgroundColor: c.surface2 },
      ]}
      onPress={() => onPress(movie)}
    >
      <MoviePoster uri={movie.poster_url} width={44} height={64} borderRadius={6} />
      <View style={styles.info}>
        <Text style={[styles.title, { color: c.textSoft }]} numberOfLines={2}>
          {movie.title}
        </Text>
        {movie.year != null && (
          <Text style={[styles.year, { color: c.textFaint }]}>{movie.year}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 3,
  },
  year: {
    fontSize: 13,
  },
});
