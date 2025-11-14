import { Stack } from 'expo-router';

export default function RentalStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="overview" />
      <Stack.Screen name="add" />
      <Stack.Screen name="scan" />
    </Stack>
  );
}
