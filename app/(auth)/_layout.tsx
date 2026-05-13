import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="age-gate" />
      <Stack.Screen name="consent" />
      <Stack.Screen name="placement" />
    </Stack>
  );
}
