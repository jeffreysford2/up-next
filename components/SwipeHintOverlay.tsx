import { StyleSheet, Text, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

type Props = {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
};

const HINT_START = 30;
const HINT_FULL = 100;

function interpolateOpacity(value: number, start: number, full: number): number {
  'worklet';
  if (value < start) return 0;
  return Math.min((value - start) / (full - start), 1);
}

export default function SwipeHintOverlay({ translateX, translateY }: Props) {
  const likeStyle = useAnimatedStyle(() => ({
    opacity:
      translateX.value > HINT_START
        ? interpolateOpacity(translateX.value, HINT_START, HINT_FULL)
        : 0,
  }));

  const nopeStyle = useAnimatedStyle(() => ({
    opacity:
      translateX.value < -HINT_START
        ? interpolateOpacity(-translateX.value, HINT_START, HINT_FULL)
        : 0,
  }));

  const loveStyle = useAnimatedStyle(() => ({
    opacity:
      translateY.value < -HINT_START
        ? interpolateOpacity(-translateY.value, HINT_START, HINT_FULL)
        : 0,
  }));

  const skipStyle = useAnimatedStyle(() => ({
    opacity:
      translateY.value > HINT_START
        ? interpolateOpacity(translateY.value, HINT_START, HINT_FULL)
        : 0,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* LIKE — right swipe, top-left stamp */}
      <Animated.View style={[styles.hint, styles.likeHint, likeStyle]}>
        <Text style={[styles.hintText, styles.likeText]}>LIKE</Text>
      </Animated.View>

      {/* NOPE — left swipe, top-right stamp */}
      <Animated.View style={[styles.hint, styles.nopeHint, nopeStyle]}>
        <Text style={[styles.hintText, styles.nopeText]}>NOPE</Text>
      </Animated.View>

      {/* LOVE — up swipe, top-center */}
      <Animated.View style={[styles.hint, styles.loveHint, loveStyle]}>
        <Text style={[styles.hintText, styles.loveText]}>LOVE</Text>
      </Animated.View>

      {/* SKIP — down swipe, bottom-center */}
      <Animated.View style={[styles.hint, styles.skipHint, skipStyle]}>
        <Text style={[styles.hintText, styles.skipText]}>SKIP</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: {
    position: 'absolute',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  hintText: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 3,
  },
  likeHint: {
    top: 40,
    left: 20,
    borderColor: '#22c55e',
    transform: [{ rotate: '-15deg' }],
  },
  likeText: {
    color: '#22c55e',
  },
  nopeHint: {
    top: 40,
    right: 20,
    borderColor: '#ef4444',
    transform: [{ rotate: '15deg' }],
  },
  nopeText: {
    color: '#ef4444',
  },
  loveHint: {
    bottom: 60,
    alignSelf: 'center',
    left: '25%',
    borderColor: '#a855f7',
  },
  loveText: {
    color: '#a855f7',
  },
  skipHint: {
    top: 40,
    alignSelf: 'center',
    left: '28%',
    borderColor: '#94a3b8',
  },
  skipText: {
    color: '#94a3b8',
  },
});
