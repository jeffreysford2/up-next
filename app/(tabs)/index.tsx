import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Bucket, Movie, MovieFilter, DEFAULT_FILTER, isFilterActive } from '../../types';
import { useRatingsStore } from '../../store/ratingsStore';
import { useRecommendationsStore } from '../../store/recommendationsStore';
import { buildRecommendationQueue } from '../../utils/recommendations';
import { getFilteredMovies } from '../../services/tmdb';
import DiscoverCard from '../../components/DiscoverCard';
import RatingActionSheet from '../../components/RatingActionSheet';
import FilterSheet from '../../components/FilterSheet';
import { useTheme } from '../../hooks/useTheme';

const ACCENT = '#6366f1';
// Fetch more filtered results when this many cards remain
const FILTERED_PREFETCH_THRESHOLD = 3;

export default function DiscoverScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState<MovieFilter>(DEFAULT_FILTER);

  // Filtered mode uses its own queue + cursor, separate from the rec store
  const [filteredQueue, setFilteredQueue] = useState<Movie[]>([]);
  const [filteredCursor, setFilteredCursor] = useState(0);
  const filterPageRef = useRef(1);
  const filterLoadingRef = useRef(false);

  // Unfiltered mode uses the recommendations store
  const [localCursor, setLocalCursor] = useState(0);

  const router = useRouter();
  const c = useTheme();

  const rateMovie = useRatingsStore((s) => s.rateMovie);
  const hydrated = useRatingsStore((s) => s.hydrated);
  const queue = useRecommendationsStore((s) => s.queue);
  const setQueue = useRecommendationsStore((s) => s.setQueue);

  const filterOn = isFilterActive(filter);
  const movie: Movie | null = filterOn
    ? (filteredQueue[filteredCursor] ?? null)
    : (queue[localCursor] ?? null);

  // ── Unfiltered queue ──────────────────────────────────────────────────────

  const loadQueue = useCallback(async () => {
    setIsLoading(true);
    try {
      const { ratings, movies } = useRatingsStore.getState();
      const recommended = await buildRecommendationQueue(ratings, movies);
      setQueue(recommended);
      setLocalCursor(0);
    } catch (err) {
      console.error('Failed to build recommendation queue:', err);
    } finally {
      setIsLoading(false);
    }
  }, [setQueue]);

  useEffect(() => {
    if (hydrated && queue.length === 0 && !filterOn) {
      loadQueue();
    }
  }, [hydrated]);

  useFocusEffect(
    useCallback(() => {
      if (!hydrated || filterOn) return;
      if (queue.length === 0 || localCursor >= queue.length) {
        loadQueue();
      }
    }, [hydrated, filterOn, queue.length, localCursor, loadQueue])
  );

  // ── Filtered queue ────────────────────────────────────────────────────────

  const loadFilteredPage = useCallback(async (page: number) => {
    if (filterLoadingRef.current) return;
    filterLoadingRef.current = true;
    setIsLoading(true);
    try {
      const results = await getFilteredMovies(filterRef.current, page);
      setFilteredQueue((prev) => (page === 1 ? results : [...prev, ...results]));
      filterPageRef.current = page + 1;
    } catch (err) {
      console.error('Failed to load filtered movies:', err);
    } finally {
      filterLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  const filterRef = useRef<MovieFilter>(DEFAULT_FILTER);
  useEffect(() => { filterRef.current = filter; }, [filter]);

  // When filter changes: reset filtered state and fetch page 1
  useEffect(() => {
    if (!filterOn) return;
    setFilteredQueue([]);
    setFilteredCursor(0);
    filterPageRef.current = 1;
    loadFilteredPage(1);
  }, [filter]);

  // Prefetch next filtered page when approaching the end
  useEffect(() => {
    if (!filterOn) return;
    const remaining = filteredQueue.length - filteredCursor;
    if (remaining <= FILTERED_PREFETCH_THRESHOLD && !filterLoadingRef.current) {
      loadFilteredPage(filterPageRef.current);
    }
  }, [filteredCursor, filteredQueue.length, filterOn]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleDismiss = useCallback(() => {
    if (filterOn) {
      setFilteredCursor((c) => c + 1);
    } else {
      setLocalCursor((c) => c + 1);
    }
  }, [filterOn]);

  const handleRatePress = useCallback(() => setShowSheet(true), []);

  const handleRateSelect = useCallback(
    (bucket: Bucket) => {
      if (movie) rateMovie(movie, bucket);
      setShowSheet(false);
      handleDismiss();
    },
    [movie, rateMovie, handleDismiss]
  );

  // ── Render ────────────────────────────────────────────────────────────────

  const ratedCount = Object.keys(useRatingsStore.getState().ratings).length;

  if (!hydrated) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (!filterOn && ratedCount === 0) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <Text style={[styles.emptyTitle, { color: c.text }]}>Nothing to discover yet</Text>
        <Text style={[styles.emptySubtext, { color: c.textFaint }]}>
          Head to the Rate tab and rate some movies first — we'll build your recommendations from there.
        </Text>
      </View>
    );
  }

  if (isLoading && !movie) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <View style={styles.topBar}>
          <Text style={[styles.screenTitle, { color: c.text }]}>Discover</Text>
          <FilterButton filterOn={filterOn} onPress={() => setShowFilter(true)} c={c} />
        </View>
        <ActivityIndicator size="large" color={ACCENT} />
        <Text style={[styles.loadingText, { color: c.textFaint }]}>
          {filterOn ? 'Fetching filtered movies…' : "Finding movies you'll love…"}
        </Text>
        <FilterSheet visible={showFilter} filter={filter} onChange={setFilter} onClose={() => setShowFilter(false)} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.topBar}>
        <Text style={[styles.screenTitle, { color: c.text }]}>Discover</Text>
        <FilterButton filterOn={filterOn} onPress={() => setShowFilter(true)} c={c} />
      </View>

      {movie ? (
        <DiscoverCard
          key={`${movie.tmdb_id}-${filterOn ? filteredCursor : localCursor}`}
          movie={movie}
          onDismiss={handleDismiss}
          onRatePress={handleRatePress}
          onPress={() => router.push(`/movie/${movie.tmdb_id}`)}
        />
      ) : (
        <View style={styles.emptyInner}>
          {filterOn ? (
            <>
              <Text style={[styles.emptyTitle, { color: c.text }]}>No matches</Text>
              <Text style={[styles.emptySubtext, { color: c.textFaint }]}>
                Try adjusting your filters.
              </Text>
              <Pressable style={styles.clearButton} onPress={() => setFilter(DEFAULT_FILTER)}>
                <Text style={styles.clearButtonText}>Clear filters</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={[styles.emptyTitle, { color: c.text }]}>You've seen everything</Text>
              <Text style={[styles.emptySubtext, { color: c.textFaint }]}>
                Rate more movies to unlock new recommendations.
              </Text>
            </>
          )}
        </View>
      )}

      <RatingActionSheet
        visible={showSheet}
        movie={movie ?? null}
        onSelect={handleRateSelect}
        onDismiss={() => setShowSheet(false)}
      />

      <FilterSheet
        visible={showFilter}
        filter={filter}
        onChange={setFilter}
        onClose={() => setShowFilter(false)}
      />
    </View>
  );
}

function FilterButton({ filterOn, onPress, c }: { filterOn: boolean; onPress: () => void; c: any }) {
  return (
    <Pressable
      style={[styles.filterButton, filterOn && styles.filterButtonOn]}
      onPress={onPress}
      hitSlop={12}
    >
      <Text style={[styles.filterButtonText, filterOn && styles.filterButtonTextOn]}>
        {filterOn ? '● Filtered' : 'Filter'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  topBar: {
    position: 'absolute',
    top: 60,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  screenTitle: { fontSize: 22, fontWeight: '800' },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#475569',
  },
  filterButtonOn: { backgroundColor: ACCENT, borderColor: ACCENT },
  filterButtonText: { fontSize: 13, fontWeight: '600', color: '#94a3b8' },
  filterButtonTextOn: { color: '#fff' },
  emptyInner: { alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  emptySubtext: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  loadingText: { fontSize: 14, marginTop: 12 },
  clearButton: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: ACCENT,
  },
  clearButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
