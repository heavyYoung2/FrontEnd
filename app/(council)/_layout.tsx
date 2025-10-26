import { Tabs } from 'expo-router';
import HBTabBar from '../../src/components/HBTabBar';

export default function CouncilTabs() {
  return (
    <Tabs screenOptions={{ headerShown: false }}
          tabBar={(p) => <HBTabBar {...p} centerRoute="index" />}>
      <Tabs.Screen name="index" />       {/* 공지/달력 홈 */}
      <Tabs.Screen name="locker-admin" />
      <Tabs.Screen name="notice-admin" />
      <Tabs.Screen name="rental-admin" />
      <Tabs.Screen name="mypage" />
    </Tabs>
  );
}
