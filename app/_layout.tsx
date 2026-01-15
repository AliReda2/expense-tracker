import { initDB } from '@/lib/db';
import { Stack } from 'expo-router';
import { useEffect } from 'react';

export default function RootLayout() {
  useEffect(() => {
    (async () => {
      await initDB();
    })();
  }, []);

  return (
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
            paddingHorizontal: 10,
            paddingTop: 10,
            backgroundColor: '#fff',
          },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Home' }} />
        <Stack.Screen name="add" options={{ headerTitle: 'Add Expense' }} />
      </Stack>
  );}
