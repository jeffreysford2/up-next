import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Movie } from '../../types';
import { useRatingsStore } from '../../store/ratingsStore';
import { pickNextPair, pairKey } from '../../utils/ranking';
import CompareCard from '../../components/CompareCard';

export default function CompareScreen() {
  const [currentPair, setCurrentPair] = useState<[Movie, Movie] | null>(null);
  const [allResolved, setAllResolved] = useState(false);
  const skippedRef = useRef(new Set<string>());

  const computePair = useCallback(() => {
    const { ratings, comparisons, movies } = useRatingsStore.getState();
    const pair = pickNextPair(ratings, comparisons, skippedRef.current);

    if (!pair) {
      setCurrentPair(null);
      // Distinguish "no pairs left at all" from "only skipped pairs left"
      const anyPair = pickNextPair(ratings, comparisons);
      setAllResolved(!anyPair);
      return;
    }

    const movieA = movies[pair[0]];
    const movieB = movies[pair[1]];
    if (movieA && movieB) {
      setCurrentPair([movieA, movieB]);
    }
  }, []);

  // Recompute whenever this tab comes into focus
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

  // --- Empty states ---

  const ratedCount = Object.values(useRatingsStore.getState().ratings).filter(
    (r) => r.bucket !== 'unseen'
  ).length;

  if (ratedCount < 2) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyTitle}>Nothing to compare yet</Text>
        <Text style={styles.emptySubtext}>
          Head to the Rate tab and rate at least two movies first.
        </Text>
      </View>
    );
  }

  if (!currentPair && allResolved) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyTitle}>All caught up</Text>
        <Text style={styles.emptySubtext}>
          Your rankings are fully up to date. Rate more movies to unlock new comparisons.
        </Text>
      </View>
    );
  }

  if (!currentPair) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptySubtext}>Loading…</Text>
      </View>
    );
  }

  const [movieA, movieB] = currentPair;

  return (
    <View style={styles.container}>
      <Text style={styles.prompt}>Which did you like more?</Text>

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
        <Text style={styles.skipText}>Skip — I don't remember one of these</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  prompt: {
    color: '#fff',
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
    color: '#475569',
    fontSize: 14,
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
});
