import { StyleSheet, Text, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

type Props = {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
};

// How many px of drag before the hint starts appearing
const HINT_START = 30;
// How many px of drag for full opacity
const HINT_FULL = 100;
// Y threshold that separates LIKE (above) from LOVE (below)
const LOVE_Y_START = 60;

function interpolateOpacity(value: number, start: number, full: number): number {
  'worklet';
  if (value < start) return 0;
  return Math.min((value - start) / (full - start), 1);
}

export default function SwipeHintOverlay({ translateX, translateY }: Props) {
  const likeStyle = useAnimatedStyle(() => ({
    opacity:
      translateX.value > HINT_START && translateY.value <= LOVE_Y_START
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
      translateX.value > HINT_START && translateY.value > LOVE_Y_START
        ? interpolateOpacity(
            Math.min(translateX.value, translateY.value),
            HINT_START,
            HINT_FULL
          )
        : 0,
  }));

  const skipStyle = useAnimatedStyle(() => ({
    opacity:
      translateY.value > HINT_START && translateX.value <= HINT_START
        ? interpolateOpacity(translateY.value, HINT_START, HINT_FULL)
        : 0,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[styles.hint, styles.likeHint, likeStyle]}>
        <Text style={[styles.hintText, styles.likeText]}>LIKE</Text>
      </Animated.View>
      <Animated.View style={[styles.hint, styles.nopeHint, nopeStyle]}>
        <Text style={[styles.hintText, styles.nopeText]}>NOPE</Text>
      </Animated.View>
      <Animated.View style={[styles.hint, styles.loveHint, loveStyle]}>
        <Text style={[styles.hintText, styles.loveText]}>LOVE</Text>
      </Animated.View>
      <Animated.View style={[styles.hint, styles.skipHint, skipStyle]}>
        <Text style={[styles.hintText, styles.skipText]}>SKIP</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: {
    position: 'absolute',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 3,
  },
  hintText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
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
    top: 40,
    left: 20,
    borderColor: '#a855f7',
    transform: [{ rotate: '-15deg' }],
  },
  loveText: {
    color: '#a855f7',
  },
  skipHint: {
    bottom: 60,
    alignSelf: 'center',
    borderColor: '#94a3b8',
  },
  skipText: {
    color: '#94a3b8',
  },
});
