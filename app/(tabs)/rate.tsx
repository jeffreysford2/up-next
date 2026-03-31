import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, View } from 'react-native';
import { Bucket, Movie } from '../../types';
import { getTrending, getPopular, getTopRated } from '../../services/tmdb';
import { useRatingsStore } from '../../store/ratingsStore';
import { useFeedStore } from '../../store/feedStore';
import SwipeCard, { CARD_WIDTH, CARD_HEIGHT } from '../../components/SwipeCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Show this many dimmed cards behind the active card
const STACK_DEPTH = 2;
// Fetch more when the feed drops below this count
const REFETCH_THRESHOLD = 5;

// Visual config for each stack position (index 0 = top/active card)
const STACK_CONFIGS = [
  { scale: 1,    translateY: 0,  opacity: 1    },
  { scale: 0.96, translateY: 10, opacity: 0.85 },
  { scale: 0.92, translateY: 20, opacity: 0.70 },
];

export default function RateScreen() {
  const [feedMovies, setFeedMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const loadingRef = useRef(false);

  const rateMovie = useRatingsStore((s) => s.rateMovie);

  const loadBatch = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);

    try {
      const { source, page, dismissedIds, nextSource, advancePage } =
        useFeedStore.getState();
      const { ratings } = useRatingsStore.getState();

      let raw: Movie[];
      if (source === 'trending') {
        raw = await getTrending();
        nextSource();
      } else if (source === 'popular') {
        raw = await getPopular(page);
        advancePage();
      } else {
        raw = await getTopRated(page);
        advancePage();
      }

      const filtered = raw.filter(
        (m) => !ratings[m.tmdb_id] && !dismissedIds.has(m.tmdb_id)
      );
      setFeedMovies((prev) => [...prev, ...filtered]);
    } catch (err) {
      console.error('Failed to load feed batch:', err);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadBatch();
  }, [loadBatch]);

  // Load more when running low
  useEffect(() => {
    if (feedMovies.length < REFETCH_THRESHOLD && !loadingRef.current) {
      loadBatch();
    }
  }, [feedMovies.length, loadBatch]);

  const handleSwiped = useCallback(
    (movie: Movie, bucket: Bucket) => {
      rateMovie(movie, bucket);
      useFeedStore.getState().markDismissed(movie.tmdb_id);
      setFeedMovies((prev) => prev.filter((m) => m.tmdb_id !== movie.tmdb_id));
    },
    [rateMovie]
  );

  const visibleCards = feedMovies.slice(0, STACK_DEPTH + 1);

  return (
    <View style={styles.container}>
      <View style={styles.stack}>
        {/* Render back-to-front so the top card renders last and sits on top */}
        {[...visibleCards].reverse().map((movie, reversedIndex) => {
          const stackIndex = visibleCards.length - 1 - reversedIndex;
          const config = STACK_CONFIGS[stackIndex] ?? STACK_CONFIGS[STACK_CONFIGS.length - 1];
          const isTop = stackIndex === 0;

          return (
            <View
              key={movie.tmdb_id}
              style={[
                styles.cardWrapper,
                {
                  zIndex: 10 - stackIndex,
                  transform: [
                    { scale: config.scale },
                    { translateY: config.translateY },
                  ],
                  opacity: config.opacity,
                },
              ]}
            >
              {isTop ? (
                <SwipeCard movie={movie} onSwiped={handleSwiped} />
              ) : (
                // Behind cards — just the shell, no gesture or content needed
                <View style={styles.cardShell} />
              )}
            </View>
          );
        })}

        {feedMovies.length === 0 && !isLoading && (
          <Text style={styles.emptyText}>No more movies to rate right now.</Text>
        )}
        {feedMovies.length === 0 && isLoading && (
          <ActivityIndicator size="large" color="#fff" />
        )}
      </View>

      <View style={styles.hintRow}>
        <Text style={styles.hintLabel}>← Dislike</Text>
        <Text style={styles.hintLabel}>↓ Haven't seen</Text>
        <Text style={styles.hintLabel}>Love ↘</Text>
        <Text style={styles.hintLabel}>Like →</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stack: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrapper: {
    position: 'absolute',
  },
  cardShell: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    backgroundColor: '#1c1c1e',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  hintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: SCREEN_WIDTH * 0.88,
    marginTop: 20,
  },
  hintLabel: {
    color: '#475569',
    fontSize: 12,
  },
});
