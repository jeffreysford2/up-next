export type Movie = {
  tmdb_id: number;
  title: string;
  poster_url: string | null;
  year: number | null;
  genres: string[];
  popularity?: number; // TMDB global popularity score, used for recommendation ranking
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

export type FeedSource = 'trending' | 'popular' | 'top_rated';
