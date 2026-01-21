import { initDB } from '@/lib/db';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';

export default function RootLayout() {
  useEffect(() => {
    (async () => {
      await initDB();
    })();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#ff8c00',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontSize: 20,
              fontWeight: 'bold',
            },

            contentStyle: {
              backgroundColor: '#fff',
            },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'Home' }} />
          <Stack.Screen name="add" options={{ headerTitle: 'Add Expense' }} />
          <Stack.Screen name="edit" options={{ headerTitle: 'Edit Expense' }} />
          <Stack.Screen name="view" options={{ headerTitle: 'View Expense' }} />
          <Stack.Screen name="wallets" options={{ headerShown: false }} />
        </Stack>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
