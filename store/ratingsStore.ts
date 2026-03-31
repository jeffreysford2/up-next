import { create } from 'zustand';
import { Bucket, Comparison, Movie, Rating, RatingsMap } from '../types';
import { loadPersistedState, savePersistedState } from './storage';
import { buildGraph, getRankOrder } from '../utils/ranking';
import { deriveScore } from '../utils/scoring';

// Default score assigned when a movie is first rated, before any comparisons refine it
const BUCKET_MIDPOINTS: Record<Exclude<Bucket, 'unseen'>, number> = {
  loved: 9.0,
  liked: 6.5,
  disliked: 3.0,
};

// Recomputes every rated movie's score from the current DAG state
function refreshScores(ratings: RatingsMap, comparisons: Comparison[]): RatingsMap {
  const graph = buildGraph(comparisons);
  const updated = { ...ratings };

  const byBucket: Record<string, number[]> = {};
  for (const [idStr, rating] of Object.entries(ratings)) {
    if (rating.bucket === 'unseen') continue;
    const id = Number(idStr);
    if (!byBucket[rating.bucket]) byBucket[rating.bucket] = [];
    byBucket[rating.bucket].push(id);
  }

  for (const [bucket, movieIds] of Object.entries(byBucket)) {
    const ranked = getRankOrder(graph, movieIds);
    for (let i = 0; i < ranked.length; i++) {
      const id = ranked[i];
      updated[id] = {
        ...updated[id],
        score: deriveScore(bucket as Exclude<Bucket, 'unseen'>, i, ranked.length),
      };
    }
  }

  return updated;
}

type State = {
  ratings: RatingsMap;
  comparisons: Comparison[];
  movies: Record<number, Movie>; // cached Movie objects for all rated movies
  onboardingComplete: boolean;
};

type Actions = {
  rateMovie: (movie: Movie, bucket: Bucket) => void;
  recordComparison: (winnerId: number, loserId: number) => void;
  removeRating: (movieId: number) => void;
  markOnboardingComplete: () => void;
  hydrate: () => Promise<void>;
};

function persist(state: State): void {
  savePersistedState({
    ratings: state.ratings,
    comparisons: state.comparisons,
    movies: state.movies,
    onboardingComplete: state.onboardingComplete,
  });
}

export const useRatingsStore = create<State & Actions>((set, get) => ({
  ratings: {},
  comparisons: [],
  movies: {},
  onboardingComplete: false,

  rateMovie: (movie, bucket) => {
    const score = bucket === 'unseen' ? null : BUCKET_MIDPOINTS[bucket];
    const rating: Rating = {
      movie_id: movie.tmdb_id,
      bucket,
      score,
      timestamp: Date.now(),
    };
    const newRatings: RatingsMap = { ...get().ratings, [movie.tmdb_id]: rating };
    const newMovies = { ...get().movies, [movie.tmdb_id]: movie };
    const next: State = { ...get(), ratings: newRatings, movies: newMovies };
    set(next);
    persist(next);
  },

  recordComparison: (winnerId, loserId) => {
    const comparison: Comparison = {
      winner_id: winnerId,
      loser_id: loserId,
      timestamp: Date.now(),
    };
    const newComparisons = [...get().comparisons, comparison];
    const newRatings = refreshScores(get().ratings, newComparisons);
    const next: State = { ...get(), comparisons: newComparisons, ratings: newRatings };
    set(next);
    persist(next);
  },

  removeRating: (movieId) => {
    const newRatings = { ...get().ratings };
    delete newRatings[movieId];
    // Comparison history is preserved — it still informs other movies' relative ranks
    const next: State = { ...get(), ratings: newRatings };
    set(next);
    persist(next);
  },

  markOnboardingComplete: () => {
    const next: State = { ...get(), onboardingComplete: true };
    set(next);
    persist(next);
  },

  hydrate: async () => {
    const saved = await loadPersistedState();
    if (saved) {
      set({
        ratings: saved.ratings,
        comparisons: saved.comparisons,
        movies: saved.movies ?? {},
        onboardingComplete: saved.onboardingComplete,
      });
    }
  },
}));
