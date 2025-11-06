import { Stack } from 'expo-router';

export default function LockerStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="applications" />
      <Stack.Screen name="history" />
    </Stack>
  );
}

