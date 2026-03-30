import { create } from 'zustand';
import { Movie } from '../types';

// Ephemeral — not persisted. Queue is rebuilt from TMDB on app open.

type State = {
  queue: Movie[];
  cursor: number;
};

type Actions = {
  setQueue: (movies: Movie[]) => void;
  advance: () => void;
  currentMovie: () => Movie | null;
};

export const useRecommendationsStore = create<State & Actions>((set, get) => ({
  queue: [],
  cursor: 0,

  setQueue: (movies) => set({ queue: movies, cursor: 0 }),

  advance: () => set({ cursor: get().cursor + 1 }),

  currentMovie: () => {
    const { queue, cursor } = get();
    return cursor < queue.length ? queue[cursor] : null;
  },
}));
