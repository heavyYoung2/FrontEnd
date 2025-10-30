// App.js
// 설명: Expo + React Navigation Bottom Tabs 기본 탭 네비게이션 설정
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
//import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// Expo에 내장된 아이콘 (설치 불필요)
import { Ionicons } from '@expo/vector-icons';

// 각 화면 컴포넌트 import
import HomeScreen from './src/screens/HomeScreen';
import QRScreen from './src/screens/QRScreen';
import RentalScreen from './src/screens/RentalScreen';
import LockerScreen from './src/screens/LockerScreen';
import MyPageScreen from './src/screens/MyPageScreen';

// Tab Navigator 인스턴스 생성
//const Tab = createBottomTabNavigator();

export default function App() {
  return (
    // 설명: 모든 네비게이션 트리는 NavigationContainer로 감싸야 함
    <NavigationContainer>
      <Tab.Navigator
        // 설명: 공통 화면 옵션(헤더 숨김, 라벨 숨김, 아이콘/색상 지정 등)
        screenOptions={({ route }) => ({
          headerShown: false,          // 상단 헤더 숨김
          tabBarShowLabel: false,      // 탭 텍스트 라벨 숨김(아이콘만)
          tabBarActiveTintColor: '#2E46F0', // 선택된 탭 아이콘 색
          tabBarInactiveTintColor: '#A0A3AB', // 비활성 탭 아이콘 색
          // 각 탭의 아이콘 설정
          tabBarIcon: ({ focused, size, color }) => {
            // 라우트명 → 아이콘 이름 매핑
            const iconMap = {
              Home: 'calendar',
              QR: 'qr-code',
              Rental: 'pricetag',
              Locker: 'lock-closed',
              MyPage: 'person-circle',
            };
            const base = iconMap[route.name] || 'ellipse';
            const name = focused ? base : `${base}-outline`; // 포커스 유무에 따라 outline 적용
            return <Ionicons name={name} size={size} color={color} />;
          },
        })}
      >
        {/* 설명: 탭 5개 등록 (이름과 컴포넌트 연결) */}
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="QR" component={QRScreen} />
        <Tab.Screen name="Rental" component={RentalScreen} />
        <Tab.Screen name="Locker" component={LockerScreen} />
        <Tab.Screen name="MyPage" component={MyPageScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
