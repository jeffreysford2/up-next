import { StyleSheet, Text, View } from 'react-native';
import { Bucket, Confidence } from '../types';

const BUCKET_COLOR: Record<Exclude<Bucket, 'unseen'>, string> = {
  loved:    '#a855f7',
  liked:    '#22c55e',
  disliked: '#ef4444',
};

type Props = {
  score: number;
  bucket: Exclude<Bucket, 'unseen'>;
  confidence: Confidence;
};

export default function ScoreBadge({ score, bucket, confidence }: Props) {
  const isWeak = confidence === 'none' || confidence === 'low';
  const color = BUCKET_COLOR[bucket];
  const label = `${isWeak ? '~' : ''}${score.toFixed(1)}`;

  const confidenceDots = confidence === 'none' ? 0
    : confidence === 'low' ? 1
    : confidence === 'medium' ? 2
    : 3;

  return (
    <View style={styles.container}>
      <Text style={[styles.score, { color }, isWeak && styles.weak]}>{label}</Text>
      <View style={styles.dots}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i < confidenceDots ? color : '#1e293b' },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4,
  },
  score: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  weak: {
    opacity: 0.6,
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
