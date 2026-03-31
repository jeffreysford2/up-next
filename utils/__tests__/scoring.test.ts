import { deriveScore, deriveConfidence } from '../scoring';

describe('deriveScore', () => {
  describe('loved bucket (8.0–10.0)', () => {
    it('returns midpoint (9.0) for a single movie', () => {
      expect(deriveScore('loved', 0, 1)).toBe(9.0);
    });

    it('returns max (10.0) for the top-ranked movie', () => {
      expect(deriveScore('loved', 0, 3)).toBe(10.0);
    });

    it('returns min (8.0) for the bottom-ranked movie', () => {
      expect(deriveScore('loved', 2, 3)).toBe(8.0);
    });

    it('returns a middle value for a middle-ranked movie', () => {
      const score = deriveScore('loved', 1, 3);
      expect(score).toBeGreaterThan(8.0);
      expect(score).toBeLessThan(10.0);
    });
  });

  describe('liked bucket (5.0–7.9)', () => {
    it('returns midpoint (~6.5) for a single movie', () => {
      expect(deriveScore('liked', 0, 1)).toBe(6.5);
    });

    it('returns max (7.9) for the top-ranked movie', () => {
      expect(deriveScore('liked', 0, 2)).toBe(7.9);
    });

    it('returns min (5.0) for the bottom-ranked movie', () => {
      expect(deriveScore('liked', 1, 2)).toBe(5.0);
    });
  });

  describe('disliked bucket (1.0–4.9)', () => {
    it('returns midpoint (~3.0) for a single movie', () => {
      expect(deriveScore('disliked', 0, 1)).toBe(3.0);
    });

    it('returns max (4.9) for the top-ranked movie', () => {
      expect(deriveScore('disliked', 0, 2)).toBe(4.9);
    });

    it('returns min (1.0) for the bottom-ranked movie', () => {
      expect(deriveScore('disliked', 1, 2)).toBe(1.0);
    });
  });

  it('rounds to one decimal place', () => {
    const score = deriveScore('liked', 1, 3);
    const decimal = score.toString().split('.')[1] ?? '0';
    expect(decimal.length).toBeLessThanOrEqual(1);
  });
});

describe('deriveConfidence', () => {
  it('returns none for 0 comparisons', () => {
    expect(deriveConfidence(0)).toBe('none');
  });

  it('returns low for 1 comparison', () => {
    expect(deriveConfidence(1)).toBe('low');
  });

  it('returns low for 2 comparisons', () => {
    expect(deriveConfidence(2)).toBe('low');
  });

  it('returns medium for 3 comparisons', () => {
    expect(deriveConfidence(3)).toBe('medium');
  });

  it('returns medium for 6 comparisons', () => {
    expect(deriveConfidence(6)).toBe('medium');
  });

  it('returns high for 7 comparisons', () => {
    expect(deriveConfidence(7)).toBe('high');
  });

  it('returns high for many comparisons', () => {
    expect(deriveConfidence(50)).toBe('high');
  });
});
