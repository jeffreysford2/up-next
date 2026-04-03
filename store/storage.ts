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
  try {
    const raw = await AsyncStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as PersistedState) : null;
  } catch {
    // Storage unavailable or corrupted — start fresh
    return null;
  }
}

export async function savePersistedState(state: PersistedState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    // Write failure is non-fatal — in-memory state remains correct
    console.warn('Failed to persist state to AsyncStorage');
  }
}
