export type Movie = {
  tmdb_id: number;
  title: string;
  poster_url: string | null;
  year: number | null;
  genres: string[];
  popularity?: number;    // TMDB global popularity score, used for recommendation ranking
  overview?: string;      // Plot summary from TMDB
  runtime?: number;       // Minutes
  tagline?: string;
  vote_average?: number;  // TMDB community rating (0–10)
};

export type Bucket = 'loved' | 'liked' | 'disliked' | 'unseen';

export type Confidence = 'none' | 'low' | 'medium' | 'high';

export type Rating = {
  movie_id: number;
  bucket: Bucket;
  score: number | null; // null for unseen; defaults to bucket midpoint, refined by comparisons
  timestamp: number;
};

export type Comparison = {
  winner_id: number;
  loser_id: number;
  timestamp: number;
};

// tmdb_id → Rating
export type RatingsMap = Record<number, Rating>;

// tmdb_id → derived 1–10 score
export type ScoresMap = Record<number, number>;

export type FeedSource = 'trending' | 'now_playing' | 'popular_recent';

export type MovieFilter = {
  genres: string[];
  decades: number[];    // decade start years: 1960, 1970, …, 2020
  minRating: number;    // 0 = no minimum
  language: string;     // '' = any; ISO 639-1 code e.g. 'en', 'ko'
  providers: number[];  // TMDB watch provider IDs
};

export const DEFAULT_FILTER: MovieFilter = {
  genres: [],
  decades: [],
  minRating: 0,
  language: '',
  providers: [],
};

export function isFilterActive(f: MovieFilter): boolean {
  return (
    f.genres.length > 0 ||
    f.decades.length > 0 ||
    f.minRating > 0 ||
    f.language !== '' ||
    f.providers.length > 0
  );
}
