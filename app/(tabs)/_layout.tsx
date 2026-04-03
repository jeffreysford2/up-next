import { Tabs } from 'expo-router';
import CustomTabBar from '../../components/CustomTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"   options={{ title: 'Discover' }} />
      <Tabs.Screen name="rate"    options={{ title: 'Rate' }} />
      <Tabs.Screen name="compare" options={{ title: 'Compare' }} />
      <Tabs.Screen name="stats"   options={{ title: 'Stats' }} />
    </Tabs>
  );
}
