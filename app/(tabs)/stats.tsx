import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRatingsStore } from '../../store/ratingsStore';
import {
  getCountsByBucket,
  getScoreDistribution,
  getTopGenres,
  getMostCompared,
  getLowConfidenceMovies,
} from '../../utils/stats';
import StatsChart from '../../components/StatsChart';

const BUCKET_COLORS: Record<string, string> = {
  loved: '#a855f7',
  liked: '#22c55e',
  disliked: '#ef4444',
  unseen: '#475569',
};

const SCORE_COLOR = '#6366f1';
const GENRE_COLOR = '#f59e0b';

export default function StatsScreen() {
  const ratings = useRatingsStore((s) => s.ratings);
  const comparisons = useRatingsStore((s) => s.comparisons);
  const movies = useRatingsStore((s) => s.movies);

  const counts = getCountsByBucket(ratings);

  if (counts.total === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No stats yet</Text>
        <Text style={styles.emptySubtext}>
          Rate some movies on the Rate tab and your stats will appear here.
        </Text>
      </View>
    );
  }

  const scoreDist = getScoreDistribution(ratings);
  const topGenres = getTopGenres(ratings, movies);
  const mostCompared = getMostCompared(comparisons, movies);
  const lowConfidence = getLowConfidenceMovies(ratings, comparisons, movies);

  const bucketData = [
    { label: 'Loved', value: counts.loved, color: BUCKET_COLORS.loved },
    { label: 'Liked', value: counts.liked, color: BUCKET_COLORS.liked },
    { label: 'Disliked', value: counts.disliked, color: BUCKET_COLORS.disliked },
    { label: 'Unseen', value: counts.unseen, color: BUCKET_COLORS.unseen },
  ].filter((d) => d.value > 0);

  const scoreChartData = scoreDist.map((bin) => ({
    label: bin.label,
    value: bin.count,
    color: SCORE_COLOR,
  }));

  const genreChartData = topGenres.map((g) => ({
    label: g.genre,
    value: g.avgScore,
    color: GENRE_COLOR,
  }));

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.screenTitle}>Stats</Text>

      {/* --- Overview --- */}
      <Section title={`${counts.total} movies rated`}>
        <StatsChart data={bucketData} showValues />
      </Section>

      {/* --- Score Distribution --- */}
      {scoreDist.some((b) => b.count > 0) && (
        <Section title="Score distribution">
          <StatsChart data={scoreChartData} showValues />
        </Section>
      )}

      {/* --- Top Genres --- */}
      {topGenres.length > 0 && (
        <Section title="Top genres by avg score">
          {topGenres.map((g) => (
            <View key={g.genre} style={styles.genreRow}>
              <Text style={styles.genreLabel} numberOfLines={1}>
                {g.genre}
              </Text>
              <Text style={styles.genreScore}>{g.avgScore.toFixed(1)}</Text>
              <Text style={styles.genreCount}>({g.count})</Text>
            </View>
          ))}
        </Section>
      )}

      {/* --- Most Compared --- */}
      {mostCompared.length > 0 && (
        <Section title="Most compared">
          {mostCompared.map((entry) => (
            <View key={entry.movie.tmdb_id} style={styles.listRow}>
              <Text style={styles.listTitle} numberOfLines={1}>
                {entry.movie.title}
              </Text>
              <Text style={styles.listMeta}>
                {entry.count} comparison{entry.count !== 1 ? 's' : ''}
              </Text>
            </View>
          ))}
        </Section>
      )}

      {/* --- Low Confidence Nudge --- */}
      {lowConfidence.length > 0 && (
        <Section title="Could use more comparisons">
          <Text style={styles.nudgeText}>
            These movies haven't been compared much — head to the Compare tab to refine their scores.
          </Text>
          {lowConfidence.map((entry) => (
            <View key={entry.movie.tmdb_id} style={styles.listRow}>
              <Text style={styles.listTitle} numberOfLines={1}>
                {entry.movie.title}
              </Text>
              <Text style={styles.listMeta}>
                {entry.compCount === 0
                  ? 'no comparisons yet'
                  : `${entry.compCount} comparison${entry.compCount !== 1 ? 's' : ''}`}
              </Text>
            </View>
          ))}
        </Section>
      )}
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  screenTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 28,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  genreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  genreLabel: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 14,
  },
  genreScore: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  genreCount: {
    color: '#475569',
    fontSize: 12,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1e293b',
  },
  listTitle: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 14,
    marginRight: 12,
  },
  listMeta: {
    color: '#475569',
    fontSize: 12,
  },
  nudgeText: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
});
