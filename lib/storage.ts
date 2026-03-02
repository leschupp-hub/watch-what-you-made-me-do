import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recommendation } from './gemini';

const FAVORITES_KEY = '@wwymmd/favorites';

export async function getFavorites(): Promise<Recommendation[]> {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addFavorite(rec: Recommendation): Promise<Recommendation[]> {
  const favorites = await getFavorites();
  if (favorites.some((f) => f.id === rec.id)) return favorites;
  const updated = [...favorites, { ...rec, savedAt: Date.now() }];
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  return updated;
}

export async function removeFavorite(id: string): Promise<Recommendation[]> {
  const favorites = await getFavorites();
  const updated = favorites.filter((f) => f.id !== id);
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  return updated;
}

export async function isFavorite(id: string): Promise<boolean> {
  const favorites = await getFavorites();
  return favorites.some((f) => f.id === id);
}
