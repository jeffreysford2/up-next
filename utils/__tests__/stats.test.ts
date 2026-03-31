import {
  getCountsByBucket,
  getScoreDistribution,
  getTopGenres,
  getMostCompared,
  getLowConfidenceMovies,
} from '../stats';
import { Comparison, Movie, RatingsMap } from '../../types';

const makeMovie = (id: number, genres: string[] = [], title = `Movie ${id}`): Movie => ({
  tmdb_id: id,
  title,
  poster_url: null,
  year: 2020,
  genres,
});

const makeRating = (
  movie_id: number,
  bucket: 'loved' | 'liked' | 'disliked' | 'unseen',
  score: number | null = null
) => ({ movie_id, bucket, score, timestamp: 0 });

describe('getCountsByBucket', () => {
  it('returns zeroes for empty ratings', () => {
    const counts = getCountsByBucket({});
    expect(counts).toEqual({ loved: 0, liked: 0, disliked: 0, unseen: 0, total: 0 });
  });

  it('counts each bucket correctly', () => {
    const ratings: RatingsMap = {
      1: makeRating(1, 'loved', 9.0),
      2: makeRating(2, 'loved', 8.5),
      3: makeRating(3, 'liked', 6.5),
      4: makeRating(4, 'disliked', 3.0),
      5: makeRating(5, 'unseen'),
    };
    const counts = getCountsByBucket(ratings);
    expect(counts.loved).toBe(2);
    expect(counts.liked).toBe(1);
    expect(counts.disliked).toBe(1);
    expect(counts.unseen).toBe(1);
    expect(counts.total).toBe(5);
  });
});

describe('getScoreDistribution', () => {
  it('returns 10 bins all zero for empty ratings', () => {
    const dist = getScoreDistribution({});
    expect(dist).toHaveLength(10);
    expect(dist.every((b) => b.count === 0)).toBe(true);
  });

  it('places scores in correct bins', () => {
    const ratings: RatingsMap = {
      1: makeRating(1, 'loved', 9.0),    // bin 9
      2: makeRating(2, 'loved', 10.0),   // bin 10
      3: makeRating(3, 'liked', 5.5),    // bin 6
      4: makeRating(4, 'disliked', 1.0), // bin 1
      5: makeRating(5, 'unseen'),        // no score — skipped
    };
    const dist = getScoreDistribution(ratings);
    expect(dist[0].count).toBe(1);  // bin 1
    expect(dist[5].count).toBe(1);  // bin 6
    expect(dist[8].count).toBe(1);  // bin 9
    expect(dist[9].count).toBe(1);  // bin 10
  });

  it('bins are labelled 1–10', () => {
    const dist = getScoreDistribution({});
    expect(dist.map((b) => b.label)).toEqual(['1','2','3','4','5','6','7','8','9','10']);
  });
});

describe('getTopGenres', () => {
  const movies = {
    1: makeMovie(1, ['Action', 'Thriller']),
    2: makeMovie(2, ['Action']),
    3: makeMovie(3, ['Drama']),
  };

  it('returns empty array when no rated movies', () => {
    expect(getTopGenres({}, movies)).toEqual([]);
  });

  it('computes average score per genre correctly', () => {
    const ratings: RatingsMap = {
      1: makeRating(1, 'loved', 9.0),
      2: makeRating(2, 'liked', 7.0),
      3: makeRating(3, 'disliked', 3.0),
    };
    const genres = getTopGenres(ratings, movies);
    const action = genres.find((g) => g.genre === 'Action');
    expect(action).toBeDefined();
    expect(action!.avgScore).toBe(8.0); // (9+7)/2
    expect(action!.count).toBe(2);

    const thriller = genres.find((g) => g.genre === 'Thriller');
    expect(thriller!.avgScore).toBe(9.0); // only movie 1

    const drama = genres.find((g) => g.genre === 'Drama');
    expect(drama!.avgScore).toBe(3.0);
  });

  it('sorts by average score descending', () => {
    const ratings: RatingsMap = {
      1: makeRating(1, 'loved', 10.0),
      3: makeRating(3, 'liked', 5.0),
    };
    const genres = getTopGenres(ratings, movies);
    expect(genres[0].avgScore).toBeGreaterThanOrEqual(genres[1]?.avgScore ?? 0);
  });

  it('skips unseen movies (score null)', () => {
    const ratings: RatingsMap = {
      1: makeRating(1, 'unseen'),
    };
    expect(getTopGenres(ratings, movies)).toEqual([]);
  });

  it('respects the limit parameter', () => {
    const manyMovies: Record<number, Movie> = {};
    const manyRatings: RatingsMap = {};
    for (let i = 1; i <= 10; i++) {
      manyMovies[i] = makeMovie(i, [`Genre${i}`]);
      manyRatings[i] = makeRating(i, 'liked', 6.0);
    }
    expect(getTopGenres(manyRatings, manyMovies, 3)).toHaveLength(3);
  });
});

describe('getMostCompared', () => {
  const movies = {
    1: makeMovie(1),
    2: makeMovie(2),
    3: makeMovie(3),
  };

  it('returns empty for no comparisons', () => {
    expect(getMostCompared([], movies)).toEqual([]);
  });

  it('counts both winner and loser appearances', () => {
    const comparisons: Comparison[] = [
      { winner_id: 1, loser_id: 2, timestamp: 0 },
      { winner_id: 1, loser_id: 3, timestamp: 0 },
    ];
    const result = getMostCompared(comparisons, movies);
    const movie1 = result.find((r) => r.movie.tmdb_id === 1);
    expect(movie1!.count).toBe(2);
  });

  it('sorts by count descending', () => {
    const comparisons: Comparison[] = [
      { winner_id: 1, loser_id: 2, timestamp: 0 },
      { winner_id: 1, loser_id: 3, timestamp: 0 },
      { winner_id: 2, loser_id: 3, timestamp: 0 },
    ];
    const result = getMostCompared(comparisons, movies);
    expect(result[0].count).toBeGreaterThanOrEqual(result[1].count);
  });

  it('excludes movies not in the cache', () => {
    const comparisons: Comparison[] = [
      { winner_id: 99, loser_id: 1, timestamp: 0 },
    ];
    const result = getMostCompared(comparisons, movies);
    expect(result.every((r) => r.movie.tmdb_id !== 99)).toBe(true);
  });
});

describe('getLowConfidenceMovies', () => {
  const movies = {
    1: makeMovie(1),
    2: makeMovie(2),
    3: makeMovie(3),
  };

  it('returns all rated non-unseen movies when no comparisons exist', () => {
    const ratings: RatingsMap = {
      1: makeRating(1, 'loved', 9.0),
      2: makeRating(2, 'liked', 6.5),
      3: makeRating(3, 'unseen'),
    };
    const result = getLowConfidenceMovies(ratings, [], movies);
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.compCount === 0)).toBe(true);
  });

  it('excludes movies with 3 or more comparisons', () => {
    const ratings: RatingsMap = {
      1: makeRating(1, 'loved', 9.0),
      2: makeRating(2, 'liked', 6.5),
    };
    const comparisons: Comparison[] = [
      { winner_id: 1, loser_id: 2, timestamp: 0 },
      { winner_id: 1, loser_id: 2, timestamp: 0 },
      { winner_id: 1, loser_id: 2, timestamp: 0 },
    ];
    const result = getLowConfidenceMovies(ratings, comparisons, movies);
    // Movie 1 has 3 comparisons — excluded. Movie 2 has 3 — excluded.
    expect(result).toHaveLength(0);
  });

  it('excludes unseen movies', () => {
    const ratings: RatingsMap = {
      1: makeRating(1, 'unseen'),
    };
    expect(getLowConfidenceMovies(ratings, [], movies)).toHaveLength(0);
  });

  it('sorts by comparison count ascending (least compared first)', () => {
    const ratings: RatingsMap = {
      1: makeRating(1, 'loved', 9.0),
      2: makeRating(2, 'liked', 6.5),
    };
    const comparisons: Comparison[] = [
      { winner_id: 1, loser_id: 2, timestamp: 0 },
      { winner_id: 1, loser_id: 2, timestamp: 0 },
    ];
    const result = getLowConfidenceMovies(ratings, comparisons, movies);
    expect(result[0].compCount).toBeLessThanOrEqual(result[result.length - 1]?.compCount ?? Infinity);
  });
});
