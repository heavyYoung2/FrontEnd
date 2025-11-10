import { Stack } from 'expo-router';
import { AuthProvider } from '@/src/auth/AuthProvider';

export default function RootLayout() {
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
