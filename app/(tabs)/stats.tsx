import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useRatingsStore } from '../../store/ratingsStore';
import {
  getCountsByBucket,
  getScoreDistribution,
  getTopGenres,
  getMostCompared,
  getLowConfidenceMovies,
} from '../../utils/stats';
import StatsChart from '../../components/StatsChart';
import { useTheme } from '../../hooks/useTheme';

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
  const c = useTheme();
  const router = useRouter();

  const counts = getCountsByBucket(ratings);

  if (counts.total === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: c.bg }]}>
        <Text style={[styles.emptyTitle, { color: c.text }]}>No stats yet</Text>
        <Text style={[styles.emptySubtext, { color: c.textFaint }]}>
          Rate some movies on the Rate tab and your stats will appear here.
        </Text>
      </View>
    );
  }

  const scoreDist = getScoreDistribution(ratings);
  const topGenres = getTopGenres(ratings, movies);
  const mostCompared = getMostCompared(comparisons, movies);
  const lowConfidence = getLowConfidenceMovies(ratings, comparisons, movies);

  // All scored (non-unseen) movies sorted by score descending
  const rankings = Object.values(ratings)
    .filter((r) => r.score != null && r.bucket !== 'unseen')
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const bucketData = [
    { label: 'Loved',   value: counts.loved,    color: BUCKET_COLORS.loved    },
    { label: 'Liked',   value: counts.liked,    color: BUCKET_COLORS.liked    },
    { label: 'Disliked',value: counts.disliked, color: BUCKET_COLORS.disliked },
    { label: 'Unseen',  value: counts.unseen,   color: BUCKET_COLORS.unseen   },
  ].filter((d) => d.value > 0);

  const scoreChartData = scoreDist.map((bin) => ({
    label: bin.label,
    value: bin.count,
    color: SCORE_COLOR,
  }));

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: c.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.screenTitle, { color: c.text }]}>Stats</Text>

      <Section title={`${counts.total} movies rated`} color={c.textMuted}>
        <StatsChart data={bucketData} showValues />
      </Section>

      {rankings.length > 0 && (
        <Section title="Your rankings" color={c.textMuted}>
          {rankings.map((rating, index) => {
            const movie = movies[rating.movie_id];
            const bucketColor = BUCKET_COLORS[rating.bucket];
            return (
              <Pressable
                key={rating.movie_id}
                style={({ pressed }) => [
                  styles.rankRow,
                  { borderBottomColor: c.border },
                  pressed && { backgroundColor: c.surface2 },
                ]}
                onPress={() => router.push(`/movie/${rating.movie_id}`)}
              >
                <Text style={[styles.rankNum, { color: c.textDim }]}>
                  {index + 1}
                </Text>
                <Text style={[styles.rankTitle, { color: c.textSoft }]} numberOfLines={1}>
                  {movie?.title ?? `Movie ${rating.movie_id}`}
                </Text>
                <Text style={[styles.rankScore, { color: bucketColor }]}>
                  {rating.score!.toFixed(1)}
                </Text>
              </Pressable>
            );
          })}
        </Section>
      )}

      {scoreDist.some((b) => b.count > 0) && (
        <Section title="Score distribution" color={c.textMuted}>
          <StatsChart data={scoreChartData} showValues />
        </Section>
      )}

      {topGenres.length > 0 && (
        <Section title="Top genres by avg score" color={c.textMuted}>
          {topGenres.map((g) => (
            <View key={g.genre} style={styles.genreRow}>
              <Text style={[styles.genreLabel, { color: c.textSoft }]} numberOfLines={1}>
                {g.genre}
              </Text>
              <Text style={[styles.genreScore, { color: GENRE_COLOR }]}>
                {g.avgScore.toFixed(1)}
              </Text>
              <Text style={[styles.genreCount, { color: c.textDim }]}>({g.count})</Text>
            </View>
          ))}
        </Section>
      )}

      {mostCompared.length > 0 && (
        <Section title="Most compared" color={c.textMuted}>
          {mostCompared.map((entry) => (
            <View key={entry.movie.tmdb_id} style={[styles.listRow, { borderBottomColor: c.border }]}>
              <Text style={[styles.listTitle, { color: c.textSoft }]} numberOfLines={1}>
                {entry.movie.title}
              </Text>
              <Text style={[styles.listMeta, { color: c.textDim }]}>
                {entry.count} comparison{entry.count !== 1 ? 's' : ''}
              </Text>
            </View>
          ))}
        </Section>
      )}

      {lowConfidence.length > 0 && (
        <Section title="Could use more comparisons" color={c.textMuted}>
          <Text style={[styles.nudgeText, { color: c.textFaint }]}>
            Head to the Compare tab to refine these scores.
          </Text>
          {lowConfidence.map((entry) => (
            <View key={entry.movie.tmdb_id} style={[styles.listRow, { borderBottomColor: c.border }]}>
              <Text style={[styles.listTitle, { color: c.textSoft }]} numberOfLines={1}>
                {entry.movie.title}
              </Text>
              <Text style={[styles.listMeta, { color: c.textDim }]}>
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

function Section({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 28,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
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
    fontSize: 14,
  },
  genreScore: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  genreCount: {
    fontSize: 12,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listTitle: {
    flex: 1,
    fontSize: 14,
    marginRight: 12,
  },
  listMeta: {
    fontSize: 12,
  },
  nudgeText: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  rankNum: {
    width: 28,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  rankTitle: {
    flex: 1,
    fontSize: 14,
  },
  rankScore: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'right',
  },
});
