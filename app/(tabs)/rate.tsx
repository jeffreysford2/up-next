import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Bucket, Movie } from '../../types';
import { getTrending, getNowPlaying, getPopularRecent, getFilteredMovies, searchMovies } from '../../services/tmdb';
import { useRatingsStore } from '../../store/ratingsStore';
import { useFeedStore } from '../../store/feedStore';
import SwipeCard, { CARD_WIDTH, CARD_HEIGHT } from '../../components/SwipeCard';
import SearchBar from '../../components/SearchBar';
import SearchResultCard from '../../components/SearchResultCard';
import { MovieFilter, DEFAULT_FILTER, isFilterActive } from '../../types';
import FilterSheet from '../../components/FilterSheet';
import { useTheme } from '../../hooks/useTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STACK_DEPTH = 2;
const REFETCH_THRESHOLD = 5;

const STACK_CONFIGS = [
  { scale: 1,    translateY: 0,  opacity: 1    },
  { scale: 0.96, translateY: 10, opacity: 0.85 },
  { scale: 0.92, translateY: 20, opacity: 0.70 },
];

export default function RateScreen() {
  const [feedMovies, setFeedMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [searchResults, setSearchResults] = useState<Movie[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [filter, setFilter] = useState<MovieFilter>(DEFAULT_FILTER);
  const [showFilter, setShowFilter] = useState(false);
  const loadingRef = useRef(false);
  // Refs so loadBatch (memoized with []) always sees current filter state
  const filterRef = useRef<MovieFilter>(DEFAULT_FILTER);
  const filterPageRef = useRef(1);
  const router = useRouter();
  const c = useTheme();

  const rateMovie = useRatingsStore((s) => s.rateMovie);

  const filterOn = isFilterActive(filter);
  const displayMovies = filterOn ? feedMovies : feedMovies;

  // Keep ref in sync
  useEffect(() => { filterRef.current = filter; }, [filter]);

  // When filter changes: reset feed and trigger a fresh load
  useEffect(() => {
    setFeedMovies([]);
    filterPageRef.current = 1;
    if (!isFilterActive(filter)) {
      useFeedStore.getState().reset();
    }
    setRetryTrigger((n) => n + 1);
  }, [filter]);

  const loadBatch = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    setLoadError(false);

    try {
      const { ratings } = useRatingsStore.getState();
      const { dismissedIds } = useFeedStore.getState();
      const currentFilter = filterRef.current;
      const currentFilterOn = isFilterActive(currentFilter);

      let raw: Movie[];
      if (currentFilterOn) {
        raw = await getFilteredMovies(currentFilter, filterPageRef.current);
        filterPageRef.current += 1;
      } else {
        const { source, page, nextSource, advancePage } = useFeedStore.getState();
        if (source === 'trending') {
          raw = await getTrending();
          nextSource();
        } else if (source === 'now_playing') {
          raw = await getNowPlaying(page);
          advancePage();
        } else {
          raw = await getPopularRecent(page);
          advancePage();
        }
      }

      const filtered = raw.filter(
        (m) => !ratings[m.tmdb_id] && !dismissedIds.has(m.tmdb_id)
      );

      if (filtered.length === 0) {
        setRetryTrigger((n) => n + 1);
      } else {
        setFeedMovies((prev) => [...prev, ...filtered]);
      }
    } catch {
      setLoadError(true);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBatch();
  }, [loadBatch]);

  useEffect(() => {
    if (feedMovies.length < REFETCH_THRESHOLD && !loadingRef.current) {
      loadBatch();
    }
  }, [feedMovies.length, retryTrigger, loadBatch]);

  const handleSwiped = useCallback(
    (movie: Movie, bucket: Bucket) => {
      rateMovie(movie, bucket);
      useFeedStore.getState().markDismissed(movie.tmdb_id);
      setFeedMovies((prev) => prev.filter((m) => m.tmdb_id !== movie.tmdb_id));
    },
    [rateMovie]
  );

  async function handleSearch(query: string) {
    setIsSearching(true);
    try {
      const results = await searchMovies(query);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  function handleClearSearch() {
    setSearchResults(null);
  }

  function handleSearchResultPress(movie: Movie) {
    Keyboard.dismiss();
    setFeedMovies((prev) => [movie, ...prev.filter((m) => m.tmdb_id !== movie.tmdb_id)]);
    setSearchResults(null);
  }

  const visibleCards = displayMovies.slice(0, STACK_DEPTH + 1);

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchRow}>
          <View style={styles.searchBarFlex}>
            <SearchBar onSearch={handleSearch} onClear={handleClearSearch} />
          </View>
          <Pressable
            style={[styles.filterButton, filterOn && styles.filterButtonOn]}
            onPress={() => setShowFilter(true)}
            hitSlop={10}
          >
            <Text style={[styles.filterButtonText, filterOn && styles.filterButtonTextOn]}>
              {filterOn ? '● Filter' : 'Filter'}
            </Text>
          </Pressable>
        </View>
      </View>

      {searchResults !== null ? (
        <View style={styles.searchResults}>
          {isSearching ? (
            <ActivityIndicator style={styles.searchSpinner} color="#6366f1" />
          ) : searchResults.length === 0 ? (
            <Text style={[styles.statusText, { color: c.textFaint }]}>No results found.</Text>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(m) => String(m.tmdb_id)}
              renderItem={({ item }) => (
                <SearchResultCard movie={item} onPress={handleSearchResultPress} />
              )}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      ) : (
        <>
          <View style={styles.stack}>
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
                    <SwipeCard
                      movie={movie}
                      onSwiped={handleSwiped}
                      onPress={() => router.push(`/movie/${movie.tmdb_id}`)}
                    />
                  ) : (
                    <View style={styles.cardShell} />
                  )}
                </View>
              );
            })}

            {displayMovies.length === 0 && isLoading && (
              <ActivityIndicator size="large" color="#6366f1" />
            )}
            {displayMovies.length === 0 && !isLoading && loadError && (
              <View style={styles.errorState}>
                <Text style={[styles.statusText, { color: c.textMuted }]}>
                  Couldn't load movies.
                </Text>
                <Text style={[styles.statusSubtext, { color: c.textFaint }]}>
                  Check your connection and try again.
                </Text>
                <Pressable
                  style={({ pressed }) => [styles.retryButton, pressed && { opacity: 0.7 }]}
                  onPress={loadBatch}
                >
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              </View>
            )}
            {displayMovies.length === 0 && !isLoading && !loadError && filterOn && (
              <View style={styles.errorState}>
                <Text style={[styles.statusText, { color: c.textMuted }]}>No matches</Text>
                <Pressable
                  style={({ pressed }) => [styles.retryButton, pressed && { opacity: 0.7 }]}
                  onPress={() => setFilter(DEFAULT_FILTER)}
                >
                  <Text style={styles.retryText}>Clear filters</Text>
                </Pressable>
              </View>
            )}
            {displayMovies.length === 0 && !isLoading && !loadError && !filterOn && (
              <Text style={[styles.statusText, { color: c.textMuted }]}>
                No more movies to rate right now.
              </Text>
            )}
          </View>

          <View style={styles.hintRow}>
            <Text style={[styles.hintLabel, { color: c.textDim }]}>← Dislike</Text>
            <Text style={[styles.hintLabel, { color: c.textDim }]}>↓ Haven't seen</Text>
            <Text style={[styles.hintLabel, { color: c.textDim }]}>↑ Love</Text>
            <Text style={[styles.hintLabel, { color: c.textDim }]}>Like →</Text>
          </View>
        </>
      )}

      <FilterSheet
        visible={showFilter}
        filter={filter}
        onChange={setFilter}
        onClose={() => setShowFilter(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  searchBarWrapper: {
    width: SCREEN_WIDTH * 0.88,
    marginTop: 60,
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBarFlex: {
    flex: 1,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#475569',
  },
  filterButtonOn: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  filterButtonTextOn: {
    color: '#fff',
  },
  searchResults: {
    flex: 1,
    width: '100%',
  },
  searchSpinner: {
    marginTop: 32,
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
  errorState: {
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  statusSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: '#6366f1',
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  hintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: SCREEN_WIDTH * 0.88,
    marginTop: 20,
  },
  hintLabel: {
    fontSize: 12,
  },
});
