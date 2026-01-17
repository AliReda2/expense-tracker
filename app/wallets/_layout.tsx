import { Stack } from 'expo-router';

export default function WalletsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,

        headerStyle: {
          backgroundColor: '#ff8c00',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: 'bold',
        },

        contentStyle: {
          paddingHorizontal: 10,
          paddingTop: 10,
          backgroundColor: '#fff',
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Wallets' }} />
      <Stack.Screen name="add/index" options={{ title: 'Add Wallet' }} />
      <Stack.Screen name="edit/[id]/index" options={{ title: 'Edit Wallet' }} />
    </Stack>
  );
}
