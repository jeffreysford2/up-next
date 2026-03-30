import { create } from 'zustand';
import { Bucket, Comparison, Movie, Rating, RatingsMap } from '../types';
import { loadPersistedState, savePersistedState } from './storage';

// Default score assigned when a movie is first rated, before any comparisons refine it
const BUCKET_MIDPOINTS: Record<Exclude<Bucket, 'unseen'>, number> = {
  loved: 9.0,
  liked: 6.5,
  disliked: 3.0,
};

type State = {
  ratings: RatingsMap;
  comparisons: Comparison[];
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
    onboardingComplete: state.onboardingComplete,
  });
}

export const useRatingsStore = create<State & Actions>((set, get) => ({
  ratings: {},
  comparisons: [],
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
    const next: State = { ...get(), ratings: newRatings };
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
    const next: State = { ...get(), comparisons: newComparisons };
    set(next);
    persist(next);
    // Score recalculation from DAG is handled in Phase 5 (utils/ranking.ts + utils/scoring.ts)
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
        onboardingComplete: saved.onboardingComplete,
      });
    }
  },
}));
