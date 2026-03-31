import { buildGraph, isTransitivelyResolved, getRankOrder, pickNextPair } from '../ranking';
import { Comparison, RatingsMap } from '../../types';

function makeComparison(winner_id: number, loser_id: number): Comparison {
  return { winner_id, loser_id, timestamp: 0 };
}

function makeRatings(entries: Array<{ id: number; bucket: 'loved' | 'liked' | 'disliked' | 'unseen' }>): RatingsMap {
  const ratings: RatingsMap = {};
  for (const { id, bucket } of entries) {
    ratings[id] = { movie_id: id, bucket, score: null, timestamp: 0 };
  }
  return ratings;
}

describe('buildGraph', () => {
  it('builds an adjacency list from comparisons', () => {
    const graph = buildGraph([makeComparison(1, 2), makeComparison(1, 3)]);
    expect(graph[1]).toEqual(expect.arrayContaining([2, 3]));
    expect(graph[2]).toBeUndefined();
  });

  it('returns an empty graph for no comparisons', () => {
    expect(buildGraph([])).toEqual({});
  });
});

describe('isTransitivelyResolved', () => {
  it('returns true when a directly beat b', () => {
    const graph = buildGraph([makeComparison(1, 2)]);
    expect(isTransitivelyResolved(graph, 1, 2)).toBe(true);
  });

  it('returns true when b directly beat a', () => {
    const graph = buildGraph([makeComparison(2, 1)]);
    expect(isTransitivelyResolved(graph, 1, 2)).toBe(true);
  });

  it('returns true via transitive chain (a>b, b>c implies a>c)', () => {
    const graph = buildGraph([makeComparison(1, 2), makeComparison(2, 3)]);
    expect(isTransitivelyResolved(graph, 1, 3)).toBe(true);
  });

  it('returns false when no relationship exists', () => {
    const graph = buildGraph([makeComparison(1, 2)]);
    expect(isTransitivelyResolved(graph, 1, 3)).toBe(false);
  });

  it('returns false for an empty graph', () => {
    expect(isTransitivelyResolved({}, 1, 2)).toBe(false);
  });
});

describe('getRankOrder', () => {
  it('puts the movie with the most wins first', () => {
    // 1 beats 2 and 3; 2 beats 3
    const graph = buildGraph([makeComparison(1, 2), makeComparison(1, 3), makeComparison(2, 3)]);
    const order = getRankOrder(graph, [1, 2, 3]);
    expect(order[0]).toBe(1);
    expect(order[2]).toBe(3);
  });

  it('handles a single movie', () => {
    expect(getRankOrder({}, [42])).toEqual([42]);
  });

  it('handles no comparisons — order is stable but arbitrary', () => {
    const order = getRankOrder({}, [1, 2, 3]);
    expect(order).toHaveLength(3);
    expect(order).toEqual(expect.arrayContaining([1, 2, 3]));
  });
});

describe('pickNextPair', () => {
  it('returns null when fewer than 2 rated movies exist', () => {
    const ratings = makeRatings([{ id: 1, bucket: 'liked' }]);
    expect(pickNextPair(ratings, [])).toBeNull();
  });

  it('returns null when no movies are rated', () => {
    expect(pickNextPair({}, [])).toBeNull();
  });

  it('returns a pair of movies in the same bucket', () => {
    const ratings = makeRatings([
      { id: 1, bucket: 'liked' },
      { id: 2, bucket: 'liked' },
    ]);
    const pair = pickNextPair(ratings, []);
    expect(pair).not.toBeNull();
    expect(pair).toEqual(expect.arrayContaining([1, 2]));
  });

  it('does not pair movies from different buckets', () => {
    const ratings = makeRatings([
      { id: 1, bucket: 'liked' },
      { id: 2, bucket: 'loved' },
    ]);
    expect(pickNextPair(ratings, [])).toBeNull();
  });

  it('skips transitively resolved pairs', () => {
    // 1>2, 2>3 → 1 vs 3 is already resolved
    const ratings = makeRatings([
      { id: 1, bucket: 'liked' },
      { id: 2, bucket: 'liked' },
      { id: 3, bucket: 'liked' },
    ]);
    const comparisons = [makeComparison(1, 2), makeComparison(2, 3)];
    // Only unresolved pair should be 1 vs 3... wait no, 1>3 IS transitively resolved
    // So the only remaining unresolved pair after 1>2 and 2>3 is... none (all 3 pairs resolved)
    const pair = pickNextPair(ratings, comparisons);
    // 1>2 direct, 2>3 direct, 1>3 transitive — all resolved
    expect(pair).toBeNull();
  });

  it('excludes pairs in the excluded set', () => {
    const ratings = makeRatings([
      { id: 1, bucket: 'liked' },
      { id: 2, bucket: 'liked' },
    ]);
    const excluded = new Set(['1-2']);
    expect(pickNextPair(ratings, [], excluded)).toBeNull();
  });

  it('does not include unseen movies', () => {
    const ratings = makeRatings([
      { id: 1, bucket: 'unseen' },
      { id: 2, bucket: 'unseen' },
    ]);
    expect(pickNextPair(ratings, [])).toBeNull();
  });

  it('prioritises movies with fewest comparisons', () => {
    // Movie 1 has 2 comparisons; movies 2 and 3 have 1 each; movie 4 has 0.
    // Pairing 1 with 4 gives priority score 2; pairing 2 or 3 with 4 gives score 1.
    // So movie 1 should NOT be chosen — a fresher pair wins.
    const ratings = makeRatings([
      { id: 1, bucket: 'liked' },
      { id: 2, bucket: 'liked' },
      { id: 3, bucket: 'liked' },
      { id: 4, bucket: 'liked' },
    ]);
    const comparisons = [makeComparison(1, 2), makeComparison(1, 3)];
    const pair = pickNextPair(ratings, comparisons);
    expect(pair).not.toBeNull();
    expect(pair).not.toContain(1); // movie 1 has the most comparisons — should be deprioritised
    expect(pair).toContain(4);     // movie 4 is fresh — should always be in the best pair
  });
});
