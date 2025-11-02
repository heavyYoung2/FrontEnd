// app/(council)/_layout.tsx
import { Tabs } from 'expo-router';
import HBTabBar from '../../src/components/HBTabBar';

export default function CouncilTabs() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(p) => <HBTabBar {...p} centerRoute="index" />}  // 중앙: index(달력/공지)
    >
      <Tabs.Screen name="qr" />
      <Tabs.Screen name="rental" />
      <Tabs.Screen name="index" />   {/* 가운데 플로팅 */}
      <Tabs.Screen name="locker" />
      <Tabs.Screen name="mypage" />
      <Tabs.Screen name="rental-overview" options={{ href: null }} />
      <Tabs.Screen name="rental-add" options={{ href: null }} />
    </Tabs>
  );
}
