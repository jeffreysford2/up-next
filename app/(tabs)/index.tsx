import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Bucket, Movie } from '../../types';
import { useRatingsStore } from '../../store/ratingsStore';
import { useRecommendationsStore } from '../../store/recommendationsStore';
import { buildRecommendationQueue } from '../../utils/recommendations';
import DiscoverCard from '../../components/DiscoverCard';
import RatingActionSheet from '../../components/RatingActionSheet';

export default function DiscoverScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [showSheet, setShowSheet] = useState(false);

  const rateMovie = useRatingsStore((s) => s.rateMovie);

  const { currentMovie, advance, setQueue, queue, cursor } = useRecommendationsStore((s) => ({
    currentMovie: s.currentMovie,
    advance: s.advance,
    setQueue: s.setQueue,
    queue: s.queue,
    cursor: s.cursor,
  }));

  const movie = currentMovie();

  const loadQueue = useCallback(async () => {
    setIsLoading(true);
    try {
      const { ratings, movies } = useRatingsStore.getState();
      const recommended = await buildRecommendationQueue(ratings, movies);
      setQueue(recommended);
    } catch (err) {
      console.error('Failed to build recommendation queue:', err);
    } finally {
      setIsLoading(false);
    }
  }, [setQueue]);

  // Build queue on first focus; rebuild if queue runs out
  useFocusEffect(
    useCallback(() => {
      if (queue.length === 0 || cursor >= queue.length) {
        loadQueue();
      }
    }, [queue.length, cursor, loadQueue])
  );

  // Rebuild when queue is exhausted while the tab is already open
  useEffect(() => {
    if (queue.length > 0 && cursor >= queue.length && !isLoading) {
      loadQueue();
    }
  }, [cursor, queue.length, isLoading, loadQueue]);

  const handleDismiss = useCallback(() => {
    advance();
  }, [advance]);

  const handleRatePress = useCallback(() => {
    setShowSheet(true);
  }, []);

  const handleRateSelect = useCallback(
    (bucket: Bucket) => {
      const current = useRecommendationsStore.getState().currentMovie();
      if (current) {
        rateMovie(current, bucket);
      }
      setShowSheet(false);
      advance(); // auto-dismiss the card after rating
    },
    [rateMovie, advance]
  );

  // --- Empty / loading states ---

  const ratedCount = Object.keys(useRatingsStore.getState().ratings).length;

  if (ratedCount === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyTitle}>Nothing to discover yet</Text>
        <Text style={styles.emptySubtext}>
          Head to the Rate tab and rate some movies first — we'll build your recommendations from there.
        </Text>
      </View>
    );
  }

  if (isLoading && !movie) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Finding movies you'll love…</Text>
      </View>
    );
  }

  if (!movie && !isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyTitle}>You've seen everything</Text>
        <Text style={styles.emptySubtext}>
          Rate more movies to unlock new recommendations.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {movie && (
        <DiscoverCard
          key={movie.tmdb_id}
          movie={movie}
          onDismiss={handleDismiss}
          onRatePress={handleRatePress}
        />
      )}

      <RatingActionSheet
        visible={showSheet}
        movie={movie ?? null}
        onSelect={handleRateSelect}
        onDismiss={() => setShowSheet(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#64748b',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 12,
  },
});
