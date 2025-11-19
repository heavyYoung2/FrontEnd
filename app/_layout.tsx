import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '@/src/auth/AuthProvider';

// Keep splash until Pretendard is ready so iOS styling is applied consistently.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Pretendard-Regular': require('@/assets/fonts/Pretendard-Regular.otf'),
    // Map heavier font keys to lighter files so iOS uses the thinner face again.
    'Pretendard-Medium': require('@/assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-SemiBold': require('@/assets/fonts/Pretendard-Medium.otf'),
    'Pretendard-Bold': require('@/assets/fonts/Pretendard-SemiBold.otf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* 학생회 그룹 */}
        <Stack.Screen name="(council)" options={{ headerShown: false }} />
        {/* 일반 학생 그룹 */}
        <Stack.Screen name="(student)" options={{ headerShown: false }} />
        {/* 로그인/모달/세팅 등도 필요 시 여기에 추가 */}
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
