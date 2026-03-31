import { Movie, RatingsMap } from '../types';
import { getSimilarMovies } from '../services/tmdb';

const TOP_SEED_COUNT = 20;
// How much a similarity match outweighs raw TMDB popularity
const SIMILARITY_WEIGHT = 100;

// Builds an ordered list of recommended movies for the Discover tab.
// Seeds from the user's top-rated movies, fetches TMDB similar movies,
// then ranks candidates by (similarity match count × weight) + popularity.
export async function buildRecommendationQueue(
  ratings: RatingsMap,
  cachedMovies: Record<number, Movie>
): Promise<Movie[]> {
  // 1. Get top seed movies — loved and liked, sorted by score descending
  const seedRatings = Object.values(ratings)
    .filter((r) => r.bucket === 'loved' || r.bucket === 'liked')
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, TOP_SEED_COUNT);

  if (seedRatings.length === 0) return [];

  // 2. Fetch similar movies for each seed in parallel (silently skip failures)
  const similarityCount = new Map<number, number>(); // tmdb_id → how many seeds linked to it
  const movieData = new Map<number, Movie>();

  await Promise.all(
    seedRatings.map(async (rating) => {
      try {
        const similar = await getSimilarMovies(rating.movie_id);
        for (const movie of similar) {
          if (ratings[movie.tmdb_id]) continue; // already rated — skip
          similarityCount.set(movie.tmdb_id, (similarityCount.get(movie.tmdb_id) ?? 0) + 1);
          if (!movieData.has(movie.tmdb_id)) movieData.set(movie.tmdb_id, movie);
        }
      } catch {
        // skip this seed if the TMDB call fails
      }
    })
  );

  // 3. Re-surface unseen movies at lower priority
  for (const rating of Object.values(ratings)) {
    if (rating.bucket !== 'unseen') continue;
    const movie = cachedMovies[rating.movie_id];
    if (movie && !movieData.has(movie.tmdb_id)) {
      movieData.set(movie.tmdb_id, movie);
      similarityCount.set(movie.tmdb_id, 0);
    }
  }

  // 4. Score and sort
  return [...movieData.values()]
    .map((movie) => ({
      movie,
      score:
        (similarityCount.get(movie.tmdb_id) ?? 0) * SIMILARITY_WEIGHT +
        (movie.popularity ?? 0),
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.movie);
}
