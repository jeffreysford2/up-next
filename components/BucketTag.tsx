import { StyleSheet, Text, View } from 'react-native';
import { Bucket } from '../types';

const CONFIG: Record<Bucket, { label: string; color: string; bg: string }> = {
  loved:    { label: 'Loved',        color: '#a855f7', bg: '#2e1065' },
  liked:    { label: 'Liked',        color: '#22c55e', bg: '#052e16' },
  disliked: { label: 'Disliked',     color: '#ef4444', bg: '#450a0a' },
  unseen:   { label: "Haven't seen", color: '#94a3b8', bg: '#1e293b' },
};

type Props = { bucket: Bucket };

export default function BucketTag({ bucket }: Props) {
  const { label, color, bg } = CONFIG[bucket];
  return (
    <View style={[styles.tag, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
});
