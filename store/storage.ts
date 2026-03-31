import AsyncStorage from '@react-native-async-storage/async-storage';
import { RatingsMap, Comparison, Movie } from '../types';

const STORE_KEY = 'up_next_store';

export type PersistedState = {
  ratings: RatingsMap;
  comparisons: Comparison[];
  movies: Record<number, Movie>;
  onboardingComplete: boolean;
};

export async function loadPersistedState(): Promise<PersistedState | null> {
  const raw = await AsyncStorage.getItem(STORE_KEY);
  return raw ? (JSON.parse(raw) as PersistedState) : null;
}

export async function savePersistedState(state: PersistedState): Promise<void> {
  await AsyncStorage.setItem(STORE_KEY, JSON.stringify(state));
}
