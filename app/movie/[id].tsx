import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRatingsStore } from '../../store/ratingsStore';
import { getMovieDetails, getMovieCredits, MovieCredits } from '../../services/tmdb';
import { deriveConfidence } from '../../utils/scoring';
import MoviePoster from '../../components/MoviePoster';
import BucketTag from '../../components/BucketTag';
import ScoreBadge from '../../components/ScoreBadge';
import { useTheme } from '../../hooks/useTheme';
import { Bucket, Movie } from '../../types';

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const movieId = Number(id);

  const movies = useRatingsStore((s) => s.movies);
  const ratings = useRatingsStore((s) => s.ratings);
  const comparisons = useRatingsStore((s) => s.comparisons);
  const removeRating = useRatingsStore((s) => s.removeRating);
  const addMovieToCache = useRatingsStore((s) => s.addMovieToCache);

  const [fetched, setFetched] = useState<Movie | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [credits, setCredits] = useState<MovieCredits | null>(null);

  const cached = movies[movieId];
  const movie = cached ?? fetched;
  const rating = ratings[movieId];

  useEffect(() => {
    if (!cached) {
      getMovieDetails(movieId)
        .then((m) => {
          setFetched(m);
          addMovieToCache(m);
        })
        .catch(() => setFetchError(true));
    }
    // Fetch credits regardless (cached movies won't have cast/director)
    getMovieCredits(movieId)
      .then(setCredits)
      .catch(() => {}); // credits are bonus — fail silently
  }, [movieId]);

  const compCount = comparisons.filter(
    (c) => c.winner_id === movieId || c.loser_id === movieId
  ).length;
  const confidence = deriveConfidence(compCount);

  function handleRemove() {
    Alert.alert(
      'Remove rating',
      `Remove your rating for "${movie?.title}"? Comparison history will be kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeRating(movieId);
            router.back();
          },
        },
      ]
    );
  }

  const topInset = insets.top + 8;

  if (!movie && !fetchError) {
    return (
      <View style={[styles.centered, { backgroundColor: c.bg }]}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!movie && fetchError) {
    return (
      <View style={[styles.centered, { backgroundColor: c.bg }]}>
        <Pressable
          style={[styles.backButton, { marginTop: topInset }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.backArrow, { color: c.textMuted }]}>‹</Text>
          <Text style={[styles.backLabel, { color: c.textMuted }]}>Back</Text>
        </Pressable>
        <Text style={[styles.notFoundText, { color: c.textFaint }]}>Movie not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: c.bg }]}
      contentContainerStyle={[styles.content, { paddingTop: topInset }]}
    >
      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={[styles.backArrow, { color: c.textMuted }]}>‹</Text>
        <Text style={[styles.backLabel, { color: c.textMuted }]}>Back</Text>
      </Pressable>

      <MoviePoster
        uri={movie!.poster_url}
        width={220}
        height={330}
        borderRadius={12}
      />

      <View style={styles.meta}>
        <Text style={[styles.title, { color: c.text }]}>{movie!.title}</Text>

        {movie!.tagline ? (
          <Text style={[styles.tagline, { color: c.textDim }]} numberOfLines={2}>
            {movie!.tagline}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          {movie!.year != null && (
            <Text style={[styles.metaPill, { color: c.textFaint, borderColor: c.border }]}>
              {movie!.year}
            </Text>
          )}
          {movie!.runtime != null && (
            <Text style={[styles.metaPill, { color: c.textFaint, borderColor: c.border }]}>
              {Math.floor(movie!.runtime / 60)}h {movie!.runtime % 60}m
            </Text>
          )}
          {movie!.vote_average != null && (
            <Text style={[styles.metaPill, { color: c.textFaint, borderColor: c.border }]}>
              ★ {movie!.vote_average.toFixed(1)}
            </Text>
          )}
        </View>

        {movie!.genres.length > 0 && (
          <Text style={[styles.genres, { color: c.textDim }]} numberOfLines={2}>
            {movie!.genres.join(' · ')}
          </Text>
        )}

        {rating && (
          <View style={styles.ratingSection}>
            <BucketTag bucket={rating.bucket} />
            {rating.score != null && rating.bucket !== 'unseen' && (
              <ScoreBadge
                score={rating.score}
                bucket={rating.bucket as Exclude<Bucket, 'unseen'>}
                confidence={confidence}
              />
            )}
          </View>
        )}

        {!rating && (
          <Text style={[styles.unrated, { color: c.textDim }]}>Not rated yet</Text>
        )}
      </View>

      {movie!.overview ? (
        <View style={[styles.section, { borderTopColor: c.divider }]}>
          <Text style={[styles.sectionLabel, { color: c.textDim }]}>Overview</Text>
          <Text style={[styles.overview, { color: c.textSoft }]}>{movie!.overview}</Text>
        </View>
      ) : null}

      {credits && (credits.director || credits.cast.length > 0) ? (
        <View style={[styles.section, { borderTopColor: c.divider }]}>
          {credits.director ? (
            <View style={styles.creditRow}>
              <Text style={[styles.creditLabel, { color: c.textDim }]}>Director</Text>
              <Text style={[styles.creditValue, { color: c.textSoft }]}>{credits.director}</Text>
            </View>
          ) : null}
          {credits.cast.length > 0 ? (
            <View style={styles.creditRow}>
              <Text style={[styles.creditLabel, { color: c.textDim }]}>Cast</Text>
              <Text style={[styles.creditValue, { color: c.textSoft }]}>
                {credits.cast.join(', ')}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {rating && (
        <Pressable
          style={({ pressed }) => [styles.removeButton, pressed && styles.removeButtonPressed]}
          onPress={handleRemove}
        >
          <Text style={styles.removeButtonText}>Remove rating</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingBottom: 60,
    paddingHorizontal: 24,
    gap: 20,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    paddingVertical: 4,
  },
  backArrow: {
    fontSize: 34,
    lineHeight: 36,
    fontWeight: '300',
  },
  backLabel: {
    fontSize: 17,
    fontWeight: '400',
  },
  meta: {
    width: '100%',
    gap: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  tagline: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  metaPill: {
    fontSize: 13,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  genres: {
    fontSize: 13,
    textAlign: 'center',
  },
  ratingSection: {
    marginTop: 4,
    alignItems: 'center',
    gap: 16,
  },
  unrated: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    width: '100%',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  overview: {
    fontSize: 15,
    lineHeight: 23,
  },
  creditRow: {
    gap: 3,
  },
  creditLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  creditValue: {
    fontSize: 14,
    lineHeight: 20,
  },
  removeButton: {
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  removeButtonPressed: {
    opacity: 0.7,
  },
  removeButtonText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
  },
  notFoundText: {
    fontSize: 16,
  },
});
