// Expanded in Phase 3 — only Movie is needed for the service layer

export type Movie = {
  tmdb_id: number;
  title: string;
  poster_url: string | null;
  year: number | null;
  genres: string[];
};
