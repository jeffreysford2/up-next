import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const EMOJIS = ['😊', '😄', '🥳', '😍', '🤩', '😂', '🎉', '✨', '💫', '🔥', '💥', '🌟', '🎊', '😎', '🫶'];

type EmojiItem = {
  id: number;
  x: number;
  y: number;
  emoji: string;
  offsetX: number;
  floatY: number;
};

function FloatingEmoji({ item, onDone }: { item: EmojiItem; onDone: (id: number) => void }) {
  const scale = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 8, stiffness: 220 });
    translateY.value = withTiming(item.floatY, { duration: 900 });
    opacity.value = withDelay(
      350,
      withTiming(0, { duration: 550 }, (finished) => {
        if (finished) runOnJS(onDone)(item.id);
      })
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: item.offsetX },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[styles.emoji, animStyle, { left: item.x - 18, top: item.y - 18 }]}>
      {item.emoji}
    </Animated.Text>
  );
}

let _id = 0;

type Props = { children: React.ReactNode };

export default function EmojiSpawner({ children }: Props) {
  const [emojis, setEmojis] = useState<EmojiItem[]>([]);

  function spawn(x: number, y: number) {
    const burst = 4 + Math.floor(Math.random() * 4); // 4–7 per touch
    const items: EmojiItem[] = Array.from({ length: burst }, () => ({
      id: _id++,
      x,
      y,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      offsetX: (Math.random() - 0.5) * 100,
      floatY: -(120 + Math.random() * 100),
    }));
    setEmojis((prev) => [...prev, ...items]);
  }

  function remove(id: number) {
    setEmojis((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <View
      style={{ flex: 1 }}
      onStartShouldSetResponderCapture={(e) => {
        spawn(e.nativeEvent.pageX, e.nativeEvent.pageY);
        return false; // don't steal the event — just spy on it
      }}
    >
      {children}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {emojis.map((item) => (
          <FloatingEmoji key={item.id} item={item} onDone={remove} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emoji: {
    position: 'absolute',
    fontSize: 34,
  },
});
