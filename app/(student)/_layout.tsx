import { Stack } from 'expo-router';

export default function StudentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="rent-item" options={{ headerShown: false }} />
      <Stack.Screen name="rental-history" options={{ headerShown: false }} />
      <Stack.Screen name="return-item" options={{ headerShown: false }} />
      <Stack.Screen name="dues-check" options={{ headerShown: false }} />
      <Stack.Screen name="chatbot" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
    </Stack>
  );
}
