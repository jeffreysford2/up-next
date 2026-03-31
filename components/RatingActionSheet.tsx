import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Bucket, Movie } from '../types';

const BUCKETS: Array<{ bucket: Bucket; label: string; color: string }> = [
  { bucket: 'loved',    label: 'Loved it',        color: '#a855f7' },
  { bucket: 'liked',    label: 'Liked it',         color: '#22c55e' },
  { bucket: 'disliked', label: "Didn't like it",   color: '#ef4444' },
  { bucket: 'unseen',   label: "Haven't seen it",  color: '#64748b' },
];

type Props = {
  visible: boolean;
  movie: Movie | null;
  onSelect: (bucket: Bucket) => void;
  onDismiss: () => void;
};

export default function RatingActionSheet({ visible, movie, onSelect, onDismiss }: Props) {
  const translateY = useSharedValue(400);

  useEffect(() => {
    translateY.value = withTiming(visible ? 0 : 400, { duration: 280 });
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!movie) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss} />
      <Animated.View style={[styles.sheet, sheetStyle]}>
        <View style={styles.handle} />
        <Text style={styles.movieTitle} numberOfLines={1}>
          {movie.title}
        </Text>
        {BUCKETS.map(({ bucket, label, color }) => (
          <Pressable
            key={bucket}
            style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
            onPress={() => onSelect(bucket)}
          >
            <Text style={[styles.optionText, { color }]}>{label}</Text>
          </Pressable>
        ))}
        <Pressable style={styles.cancelButton} onPress={onDismiss}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 36,
    paddingHorizontal: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  movieTitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
  option: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2d2d2d',
  },
  optionPressed: {
    opacity: 0.6,
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 14,
  },
  cancelText: {
    color: '#475569',
    fontSize: 16,
    textAlign: 'center',
  },
});
