import { Tabs } from 'expo-router';
import HBTabBar from '../../../src/components/HBTabBar';

export default function StudentTabs() {
  return (
    <Tabs screenOptions={{ headerShown: false }}
          tabBar={(p) => <HBTabBar {...p} centerRoute="index" />}>
      <Tabs.Screen name="qr" />
      <Tabs.Screen name="rental" />
      <Tabs.Screen name="index" />   {/* 달력(홈) */}
      <Tabs.Screen name="locker" />
      <Tabs.Screen name="mypage" />
    </Tabs>
  );
}
