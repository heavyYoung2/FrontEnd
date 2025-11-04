import { Stack } from 'expo-router';

export default function StudentSettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="password" options={{ headerShown: false }} />
      <Stack.Screen name="guide" options={{ headerShown: false }} />
    </Stack>
  );
}
