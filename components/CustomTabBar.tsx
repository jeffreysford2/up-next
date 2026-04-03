import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';

const TABS = [
  { label: 'Discover' },
  { label: 'Rate' },
  { label: 'Compare' },
  { label: 'Stats' },
];

const ACCENT = '#6366f1';

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const active = state.index;
  const pb = insets.bottom || 16;

  function press(i: number) {
    const route = state.routes[i];
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (state.index !== i && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  }

  return (
    <View style={[styles.bar, { backgroundColor: c.bg, borderTopColor: c.divider, paddingBottom: pb }]}>
      {state.routes.map((route, i) => {
        const on = i === active;
        return (
          <Pressable key={route.key} onPress={() => press(i)} style={styles.tab}>
            <View style={[styles.topBar, { backgroundColor: on ? ACCENT : 'transparent' }]} />
            <Text style={[styles.label, on ? styles.labelOn : [styles.labelOff, { color: c.textDim }]]}>
              {TABS[i].label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 4,
    paddingTop: 6,
    paddingHorizontal: 8,
  },
  topBar: {
    width: '60%',
    height: 2.5,
    borderRadius: 2,
    marginBottom: 8,
  },
  label: {
    fontWeight: '700',
    textAlign: 'center',
  },
  labelOn: {
    fontSize: 15,
    color: '#fff',
  },
  labelOff: {
    fontSize: 11,
  },
});
