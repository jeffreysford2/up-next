import { Comparison, Movie, RatingsMap } from '../types';

export type BucketCounts = {
  loved: number;
  liked: number;
  disliked: number;
  unseen: number;
  total: number;
};

export type ScoreBin = { label: string; count: number };

export type GenreStat = { genre: string; avgScore: number; count: number };

export type ComparisonStat = { movie: Movie; count: number };

export type LowConfidenceStat = { movie: Movie; compCount: number };

export function getCountsByBucket(ratings: RatingsMap): BucketCounts {
  const counts: BucketCounts = { loved: 0, liked: 0, disliked: 0, unseen: 0, total: 0 };
  for (const rating of Object.values(ratings)) {
    counts[rating.bucket]++;
    counts.total++;
  }
  return counts;
}

// Groups scores into integer bins 1–10 using Math.ceil
export function getScoreDistribution(ratings: RatingsMap): ScoreBin[] {
  const bins: Record<number, number> = {};
  for (let i = 1; i <= 10; i++) bins[i] = 0;
  for (const rating of Object.values(ratings)) {
    if (rating.score == null) continue;
    const bin = Math.min(10, Math.max(1, Math.ceil(rating.score)));
    bins[bin]++;
  }
  return Array.from({ length: 10 }, (_, i) => ({
    label: String(i + 1),
    count: bins[i + 1],
  }));
}

export function getTopGenres(
  ratings: RatingsMap,
  movies: Record<number, Movie>,
  limit = 8
): GenreStat[] {
  const acc: Record<string, { total: number; count: number }> = {};
  for (const rating of Object.values(ratings)) {
    if (rating.score == null) continue;
    const movie = movies[rating.movie_id];
    if (!movie) continue;
    for (const genre of movie.genres) {
      if (!acc[genre]) acc[genre] = { total: 0, count: 0 };
      acc[genre].total += rating.score;
      acc[genre].count++;
    }
  }
  return Object.entries(acc)
    .map(([genre, { total, count }]) => ({
      genre,
      avgScore: Math.round((total / count) * 10) / 10,
      count,
    }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, limit);
}

export function getMostCompared(
  comparisons: Comparison[],
  movies: Record<number, Movie>,
  limit = 5
): ComparisonStat[] {
  const counts = new Map<number, number>();
  for (const { winner_id, loser_id } of comparisons) {
    counts.set(winner_id, (counts.get(winner_id) ?? 0) + 1);
    counts.set(loser_id, (counts.get(loser_id) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([id]) => movies[id] != null)
    .map(([id, count]) => ({ movie: movies[id], count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// Returns rated (non-unseen) movies with fewer than 3 comparisons — candidates for Compare tab
export function getLowConfidenceMovies(
  ratings: RatingsMap,
  comparisons: Comparison[],
  movies: Record<number, Movie>,
  limit = 5
): LowConfidenceStat[] {
  const counts = new Map<number, number>();
  for (const { winner_id, loser_id } of comparisons) {
    counts.set(winner_id, (counts.get(winner_id) ?? 0) + 1);
    counts.set(loser_id, (counts.get(loser_id) ?? 0) + 1);
  }
  return Object.values(ratings)
    .filter((r) => r.bucket !== 'unseen' && (counts.get(r.movie_id) ?? 0) < 3)
    .filter((r) => movies[r.movie_id] != null)
    .map((r) => ({ movie: movies[r.movie_id], compCount: counts.get(r.movie_id) ?? 0 }))
    .sort((a, b) => a.compCount - b.compCount)
    .slice(0, limit);
}
