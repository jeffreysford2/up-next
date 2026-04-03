import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Bucket, Movie } from '../types';
import { useTheme } from '../hooks/useTheme';

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
  const c = useTheme();

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
      <Animated.View style={[styles.sheet, { backgroundColor: c.surface }, sheetStyle]}>
        <View style={[styles.handle, { backgroundColor: c.border }]} />
        <Text style={[styles.movieTitle, { color: c.textMuted }]} numberOfLines={1}>
          {movie.title}
        </Text>
        {BUCKETS.map(({ bucket, label, color }) => (
          <Pressable
            key={bucket}
            style={({ pressed }) => [
              styles.option,
              { borderBottomColor: c.divider },
              pressed && { opacity: 0.6 },
            ]}
            onPress={() => onSelect(bucket)}
          >
            <Text style={[styles.optionText, { color }]}>{label}</Text>
          </Pressable>
        ))}
        <Pressable style={styles.cancelButton} onPress={onDismiss}>
          <Text style={[styles.cancelText, { color: c.textDim }]}>Cancel</Text>
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 36,
    paddingHorizontal: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  movieTitle: {
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
  option: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    fontSize: 16,
    textAlign: 'center',
  },
});
