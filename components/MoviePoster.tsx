import { Image, View, StyleSheet } from 'react-native';

type Props = {
  uri: string | null;
  width: number;
  height: number;
  borderRadius?: number;
};

export default function MoviePoster({ uri, width, height, borderRadius = 12 }: Props) {
  if (!uri) {
    return <View style={[styles.placeholder, { width, height, borderRadius }]} />;
  }
  return (
    <Image
      source={{ uri }}
      style={{ width, height, borderRadius }}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#2a2a2a',
  },
});
