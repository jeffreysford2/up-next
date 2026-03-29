import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Discover' }}
      />
      <Tabs.Screen
        name="rate"
        options={{ title: 'Rate' }}
      />
      <Tabs.Screen
        name="compare"
        options={{ title: 'Compare' }}
      />
      <Tabs.Screen
        name="stats"
        options={{ title: 'Stats' }}
      />
    </Tabs>
  );
}
