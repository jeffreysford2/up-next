import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

type Props = {
  onSearch: (query: string) => void;
  onClear: () => void;
  debounceMs?: number;
};

export default function SearchBar({ onSearch, onClear, debounceMs = 400 }: Props) {
  const [text, setText] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const c = useTheme();

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (text.trim().length === 0) {
      onClear();
      return;
    }
    timer.current = setTimeout(() => {
      onSearch(text.trim());
    }, debounceMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [text]);

  function handleClear() {
    setText('');
    onClear();
  }

  return (
    <View style={[styles.container, { backgroundColor: c.surface }]}>
      <TextInput
        style={[styles.input, { color: c.text }]}
        value={text}
        onChangeText={setText}
        placeholder="Search movies…"
        placeholderTextColor={c.textDim}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="never"
      />
      {text.length > 0 && (
        <Pressable onPress={handleClear} style={styles.clearButton} hitSlop={8}>
          <View style={[styles.clearIcon, { backgroundColor: c.border }]} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  clearButton: {
    marginLeft: 8,
  },
  clearIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
});
