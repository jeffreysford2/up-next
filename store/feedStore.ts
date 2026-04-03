import { create } from 'zustand';
import { FeedSource } from '../types';

// Ephemeral — not persisted. Feed resets on app open.

const SOURCE_ORDER: FeedSource[] = ['trending', 'now_playing', 'popular_recent'];

type State = {
  source: FeedSource;
  page: number;
  dismissedIds: Set<number>; // movies swiped past without rating in this session
};

type Actions = {
  advancePage: () => void;
  nextSource: () => void;
  markDismissed: (id: number) => void;
  reset: () => void;
};

export const useFeedStore = create<State & Actions>((set, get) => ({
  source: 'trending',
  page: 1,
  dismissedIds: new Set(),

  advancePage: () => set({ page: get().page + 1 }),

  nextSource: () => {
    const current = get().source;
    const next = SOURCE_ORDER[SOURCE_ORDER.indexOf(current) + 1] ?? 'popular_recent';
    set({ source: next, page: 1 });
  },

  markDismissed: (id) => {
    const dismissedIds = new Set(get().dismissedIds);
    dismissedIds.add(id);
    set({ dismissedIds });
  },

  reset: () => set({ source: 'trending', page: 1, dismissedIds: new Set() }),
}));
