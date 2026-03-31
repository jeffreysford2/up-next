import { useRatingsStore } from '../ratingsStore';
import { Movie } from '../../types';

const mockMovie: Movie = {
  tmdb_id: 1,
  title: 'Test Movie',
  poster_url: null,
  year: 2020,
  genres: ['Drama'],
};

const anotherMovie: Movie = {
  tmdb_id: 2,
  title: 'Another Movie',
  poster_url: null,
  year: 2021,
  genres: ['Comedy'],
};

beforeEach(() => {
  useRatingsStore.setState({ ratings: {}, comparisons: [], movies: {}, onboardingComplete: false });
});

describe('rateMovie', () => {
  it('adds a rating with the correct bucket', () => {
    useRatingsStore.getState().rateMovie(mockMovie, 'liked');
    const { ratings } = useRatingsStore.getState();
    expect(ratings[1].bucket).toBe('liked');
  });

  it('sets the bucket midpoint score for loved', () => {
    useRatingsStore.getState().rateMovie(mockMovie, 'loved');
    expect(useRatingsStore.getState().ratings[1].score).toBe(9.0);
  });

  it('sets the bucket midpoint score for liked', () => {
    useRatingsStore.getState().rateMovie(mockMovie, 'liked');
    expect(useRatingsStore.getState().ratings[1].score).toBe(6.5);
  });

  it('sets the bucket midpoint score for disliked', () => {
    useRatingsStore.getState().rateMovie(mockMovie, 'disliked');
    expect(useRatingsStore.getState().ratings[1].score).toBe(3.0);
  });

  it('sets score to null for unseen', () => {
    useRatingsStore.getState().rateMovie(mockMovie, 'unseen');
    expect(useRatingsStore.getState().ratings[1].score).toBeNull();
  });

  it('overwrites an existing rating', () => {
    useRatingsStore.getState().rateMovie(mockMovie, 'liked');
    useRatingsStore.getState().rateMovie(mockMovie, 'loved');
    expect(useRatingsStore.getState().ratings[1].bucket).toBe('loved');
  });
});

describe('removeRating', () => {
  it('removes the rating for the given movie', () => {
    useRatingsStore.getState().rateMovie(mockMovie, 'liked');
    useRatingsStore.getState().removeRating(1);
    expect(useRatingsStore.getState().ratings[1]).toBeUndefined();
  });

  it('preserves comparison history after removing a rating', () => {
    useRatingsStore.getState().rateMovie(mockMovie, 'liked');
    useRatingsStore.getState().rateMovie(anotherMovie, 'liked');
    useRatingsStore.getState().recordComparison(1, 2);
    useRatingsStore.getState().removeRating(1);
    expect(useRatingsStore.getState().comparisons).toHaveLength(1);
  });
});

describe('recordComparison', () => {
  it('adds a comparison with winner and loser', () => {
    useRatingsStore.getState().recordComparison(1, 2);
    const { comparisons } = useRatingsStore.getState();
    expect(comparisons).toHaveLength(1);
    expect(comparisons[0].winner_id).toBe(1);
    expect(comparisons[0].loser_id).toBe(2);
  });

  it('accumulates multiple comparisons', () => {
    useRatingsStore.getState().recordComparison(1, 2);
    useRatingsStore.getState().recordComparison(2, 3);
    expect(useRatingsStore.getState().comparisons).toHaveLength(2);
  });
});

describe('markOnboardingComplete', () => {
  it('sets onboardingComplete to true', () => {
    expect(useRatingsStore.getState().onboardingComplete).toBe(false);
    useRatingsStore.getState().markOnboardingComplete();
    expect(useRatingsStore.getState().onboardingComplete).toBe(true);
  });
});
