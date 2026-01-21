import { initDB } from '@/lib/db';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';

export default function RootLayout() {
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await initDB();
        setIsDbReady(true); // Only set this to true AFTER tables are created
      } catch (e) {
        console.error('DB Init Failed:', e);
      }
    })();
  }, []);

  // 1. Show a loading spinner while the database is initializing
  if (!isDbReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fff',
        }}
      >
        <ActivityIndicator size="large" color="#ff8c00" />
      </View>
    );
  }

  // 2. Once ready, render the navigation stack
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
