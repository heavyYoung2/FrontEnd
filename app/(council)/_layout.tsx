// app/(council)/_layout.tsx
import { Tabs } from 'expo-router';
import HBTabBar from '../../src/components/HBTabBar';

export default function CouncilTabs() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(p) => <HBTabBar {...p} centerRoute="index" />}
    >
      <Tabs.Screen name="qr" />
      <Tabs.Screen name="rental" />
      <Tabs.Screen name="index" />
      <Tabs.Screen name="locker" />
      <Tabs.Screen name="mypage" />
    </Tabs>
  );
}
