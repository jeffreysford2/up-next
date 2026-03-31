import { Movie } from '../types';

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;

// Genre ID → name cache, populated once on first use
let genreMap: Record<number, string> = {};

async function get(path: string, params: Record<string, string | number> = {}): Promise<any> {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set('api_key', API_KEY!);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${path}`);
  return res.json();
}

async function ensureGenreMap(): Promise<void> {
  if (Object.keys(genreMap).length > 0) return;
  const data = await get('/genre/movie/list');
  genreMap = Object.fromEntries(
    data.genres.map((g: { id: number; name: string }) => [g.id, g.name])
  );
}

function mapMovie(raw: any): Movie {
  // List endpoints return genre_ids; detail endpoint returns genres[{id, name}]
  const genres: string[] = raw.genre_ids
    ? raw.genre_ids.map((id: number) => genreMap[id]).filter(Boolean)
    : (raw.genres ?? []).map((g: { name: string }) => g.name);

  return {
    tmdb_id: raw.id,
    title: raw.title,
    poster_url: raw.poster_path ? `${IMAGE_BASE}${raw.poster_path}` : null,
    year: raw.release_date ? parseInt(raw.release_date.slice(0, 4), 10) : null,
    genres,
    popularity: raw.popularity ?? undefined,
  };
}

export async function getTrending(): Promise<Movie[]> {
  await ensureGenreMap();
  const data = await get('/trending/movie/week');
  return data.results.map(mapMovie);
}

export async function getPopular(page: number): Promise<Movie[]> {
  await ensureGenreMap();
  const data = await get('/movie/popular', { page });
  return data.results.map(mapMovie);
}

export async function getTopRated(page: number): Promise<Movie[]> {
  await ensureGenreMap();
  const data = await get('/movie/top_rated', { page });
  return data.results.map(mapMovie);
}

export async function searchMovies(query: string): Promise<Movie[]> {
  await ensureGenreMap();
  const data = await get('/search/movie', { query, include_adult: 'false' });
  return data.results.map(mapMovie);
}

export async function getMovieDetails(id: number): Promise<Movie> {
  // Detail endpoint returns full genres array — no need for genre map
  const raw = await get(`/movie/${id}`);
  return mapMovie(raw);
}

export async function getSimilarMovies(id: number): Promise<Movie[]> {
  await ensureGenreMap();
  const data = await get(`/movie/${id}/similar`);
  return data.results.map(mapMovie);
}
