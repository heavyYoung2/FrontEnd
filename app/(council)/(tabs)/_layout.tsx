// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import React from 'react';
import HBTabBar from '../../../src/components/HBTabBar';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(p) => <HBTabBar {...p} centerRoute="index" />}  // ⬅ 중앙 = index(달력)
    >
      <Tabs.Screen name="qr" />
      <Tabs.Screen name="rental" />
      <Tabs.Screen name="index" />   {/* 중앙 플로팅 버튼(달력) */}
      <Tabs.Screen name="locker" />
      <Tabs.Screen name="mypage" />
    </Tabs>
  );
}
