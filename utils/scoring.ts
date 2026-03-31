import { Bucket, Confidence } from '../types';

const BUCKET_RANGES: Record<Exclude<Bucket, 'unseen'>, { min: number; max: number }> = {
  loved:    { min: 8.0, max: 10.0 },
  liked:    { min: 5.0, max: 7.9  },
  disliked: { min: 1.0, max: 4.9  },
};

// rankPosition: 0 = best in bucket, totalInBucket - 1 = worst
// Returns a score to one decimal place within the bucket's range.
export function deriveScore(
  bucket: Exclude<Bucket, 'unseen'>,
  rankPosition: number,
  totalInBucket: number
): number {
  const { min, max } = BUCKET_RANGES[bucket];
  if (totalInBucket <= 1) {
    return parseFloat(((min + max) / 2).toFixed(1));
  }
  const score = max - (rankPosition / (totalInBucket - 1)) * (max - min);
  return parseFloat(score.toFixed(1));
}

// Maps comparison count to a confidence level.
export function deriveConfidence(comparisonCount: number): Confidence {
  if (comparisonCount === 0) return 'none';
  if (comparisonCount <= 2) return 'low';
  if (comparisonCount <= 6) return 'medium';
  return 'high';
}
