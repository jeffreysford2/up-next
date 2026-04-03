import { Movie, MovieFilter } from '../types';

// TMDB genre name → ID (stable, official list)
const GENRE_IDS: Record<string, number> = {
  'Action': 28, 'Adventure': 12, 'Animation': 16, 'Comedy': 35, 'Crime': 80,
  'Documentary': 99, 'Drama': 18, 'Family': 10751, 'Fantasy': 14, 'History': 36,
  'Horror': 27, 'Music': 10402, 'Mystery': 9648, 'Romance': 10749,
  'Science Fiction': 878, 'Thriller': 53, 'War': 10752, 'Western': 37,
};

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;

// Oldest release year shown in the feed — keeps results feeling current
const FEED_MIN_YEAR = 2010;

// Genre ID → name cache, populated once on first use
let genreMap: Record<number, string> = {};

async function get(path: string, params: Record<string, string | number> = {}): Promise<any> {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set('api_key', API_KEY!);
  url.searchParams.set('include_adult', 'false');
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
    overview: raw.overview || undefined,
    runtime: raw.runtime || undefined,
    tagline: raw.tagline || undefined,
    vote_average: raw.vote_average || undefined,
  };
}

// Filter applied to every feed batch — removes adult content and anything
// rated NC-17 (TMDB marks adult=true for explicit content; certification
// filtering happens at the discover level for the popular_recent source)
function isAllowed(raw: any): boolean {
  return !raw.adult;
}

export async function getTrending(): Promise<Movie[]> {
  await ensureGenreMap();
  const data = await get('/trending/movie/week');
  return data.results.filter(isAllowed).map(mapMovie);
}

// Movies currently showing in theatres — inherently very recent
export async function getNowPlaying(page: number): Promise<Movie[]> {
  await ensureGenreMap();
  const data = await get('/movie/now_playing', { page });
  return data.results.filter(isAllowed).map(mapMovie);
}

// Popular movies from the last ~15 years, certified G → R in the US
export async function getPopularRecent(page: number): Promise<Movie[]> {
  await ensureGenreMap();
  const data = await get('/discover/movie', {
    sort_by: 'popularity.desc',
    'primary_release_date.gte': `${FEED_MIN_YEAR}-01-01`,
    certification_country: 'US',
    'certification.lte': 'R',
    'vote_count.gte': 100,
    page,
  });
  return data.results.filter(isAllowed).map(mapMovie);
}

export async function getPopular(page: number): Promise<Movie[]> {
  await ensureGenreMap();
  const data = await get('/movie/popular', { page });
  return data.results.filter(isAllowed).map(mapMovie);
}

export async function getTopRated(page: number): Promise<Movie[]> {
  await ensureGenreMap();
  const data = await get('/movie/top_rated', { page });
  return data.results.filter(isAllowed).map(mapMovie);
}

export async function searchMovies(query: string): Promise<Movie[]> {
  await ensureGenreMap();
  const data = await get('/search/movie', { query });
  return data.results.filter(isAllowed).map(mapMovie);
}

export async function getMovieDetails(id: number): Promise<Movie> {
  const raw = await get(`/movie/${id}`);
  return mapMovie(raw);
}

export type MovieCredits = {
  director: string | null;
  cast: string[]; // top 5 billed actors
};

export async function getMovieCredits(id: number): Promise<MovieCredits> {
  const data = await get(`/movie/${id}/credits`);
  const director =
    (data.crew as any[]).find((p) => p.job === 'Director')?.name ?? null;
  const cast = (data.cast as any[])
    .slice(0, 5)
    .map((p) => p.name as string);
  return { director, cast };
}

export async function getFilteredMovies(filter: MovieFilter, page: number = 1): Promise<Movie[]> {
  await ensureGenreMap();
  const params: Record<string, string | number> = {
    sort_by: 'popularity.desc',
    'vote_count.gte': 50,
    page,
  };

  if (filter.genres.length > 0) {
    const ids = filter.genres.map((g) => GENRE_IDS[g]).filter(Boolean);
    if (ids.length > 0) params['with_genres'] = ids.join(',');
  }

  if (filter.decades.length > 0) {
    const sorted = [...filter.decades].sort((a, b) => a - b);
    params['primary_release_date.gte'] = `${sorted[0]}-01-01`;
    params['primary_release_date.lte'] = `${sorted[sorted.length - 1] + 9}-12-31`;
  }

  if (filter.minRating > 0) {
    params['vote_average.gte'] = filter.minRating;
  }

  if (filter.language !== '') {
    params['with_original_language'] = filter.language;
  }

  if (filter.providers.length > 0) {
    params['with_watch_providers'] = filter.providers.join('|');
    params['watch_region'] = 'US';
  }

  const data = await get('/discover/movie', params);
  return data.results.filter(isAllowed).map(mapMovie);
}

export async function getSimilarMovies(id: number): Promise<Movie[]> {
  await ensureGenreMap();
  const data = await get(`/movie/${id}/similar`);
  return data.results.filter(isAllowed).map(mapMovie);
}
