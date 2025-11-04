import { Stack } from 'expo-router';

export default function StudentRentalLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="guides" />
      <Stack.Screen name="my-status" />
    </Stack>
  );
}

