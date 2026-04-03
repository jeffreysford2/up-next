import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Movie } from '../../types';
import { useRatingsStore } from '../../store/ratingsStore';
import { pickNextPair, pairKey } from '../../utils/ranking';
import CompareCard from '../../components/CompareCard';
import { useTheme } from '../../hooks/useTheme';

export default function CompareScreen() {
  const [currentPair, setCurrentPair] = useState<[Movie, Movie] | null>(null);
  const [allResolved, setAllResolved] = useState(false);
  const skippedRef = useRef(new Set<string>());
  const c = useTheme();

  const computePair = useCallback(() => {
    const { ratings, comparisons, movies } = useRatingsStore.getState();

    // Walk candidate pairs until we find one where both movies are in cache.
    // Movies rated before the cache was introduced won't be in the movies map,
    // so we skip those pairs rather than silently showing the stale pair.
    const excluded = new Set(skippedRef.current);

    let pair = pickNextPair(ratings, comparisons, excluded);
    while (pair) {
      const movieA = movies[pair[0]];
      const movieB = movies[pair[1]];
      if (movieA && movieB) {
        setCurrentPair([movieA, movieB]);
        return;
      }
      excluded.add(pairKey(pair[0], pair[1]));
      pair = pickNextPair(ratings, comparisons, excluded);
    }

    setCurrentPair(null);
    const anyPair = pickNextPair(ratings, comparisons);
    setAllResolved(!anyPair);
  }, []);

  useFocusEffect(
    useCallback(() => {
      skippedRef.current = new Set();
      computePair();
    }, [computePair])
  );

  const handlePick = (winnerId: number, loserId: number) => {
    useRatingsStore.getState().recordComparison(winnerId, loserId);
    skippedRef.current = new Set();
    computePair();
  };

  const handleSkip = () => {
    if (!currentPair) return;
    const [a, b] = currentPair;
    skippedRef.current = new Set([
      ...skippedRef.current,
      pairKey(a.tmdb_id, b.tmdb_id),
    ]);
    computePair();
  };

  const ratedCount = Object.values(useRatingsStore.getState().ratings).filter(
    (r) => r.bucket !== 'unseen'
  ).length;

  if (ratedCount < 2) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <Text style={[styles.emptyTitle, { color: c.text }]}>Nothing to compare yet</Text>
        <Text style={[styles.emptySubtext, { color: c.textFaint }]}>
          Head to the Rate tab and rate at least two movies first.
        </Text>
      </View>
    );
  }

  if (!currentPair && allResolved) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <Text style={[styles.emptyTitle, { color: c.text }]}>All caught up</Text>
        <Text style={[styles.emptySubtext, { color: c.textFaint }]}>
          Your rankings are fully up to date. Rate more movies to unlock new comparisons.
        </Text>
      </View>
    );
  }

  if (!currentPair) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <Text style={[styles.emptySubtext, { color: c.textFaint }]}>Loading…</Text>
      </View>
    );
  }

  const [movieA, movieB] = currentPair;

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <Text style={[styles.prompt, { color: c.text }]}>Which did you like more?</Text>

      <View style={styles.row}>
        <CompareCard
          movie={movieA}
          onPress={() => handlePick(movieA.tmdb_id, movieB.tmdb_id)}
        />
        <CompareCard
          movie={movieB}
          onPress={() => handlePick(movieB.tmdb_id, movieA.tmdb_id)}
        />
      </View>

      <Pressable onPress={handleSkip} style={styles.skipButton}>
        <Text style={[styles.skipText, { color: c.textDim }]}>
          Skip — I don't remember one of these
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  prompt: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  skipButton: {
    marginTop: 28,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  skipText: {
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
