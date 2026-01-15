import { format, isSameDay, isSameMonth } from 'date-fns';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { fetchExpenses } from '../lib/db';

type Expense = {
  id: number;
  amount: number;
  note: string | null;
  date: string;
};

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const load = async () => {
    const data = (await fetchExpenses()) as Expense[];
    setExpenses(data);
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const todayTotal = expenses
    .filter((e) => isSameDay(new Date(e.date), new Date()))
    .reduce((sum, e) => sum + e.amount, 0);

  const monthTotal = expenses
    .filter((e) => isSameMonth(new Date(e.date), new Date()))
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text>Today: ${todayTotal.toFixed(2)}</Text>
      <Text>This Month: ${monthTotal.toFixed(2)}</Text>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Text>
            {format(new Date(item.date), 'dd MMM')} – ${item.amount}
            {item.note ? ` (${item.note})` : ''}
          </Text>
        )}
      />

      <Link href={'/add'} asChild>
        <Pressable
          style={{ padding: 10, backgroundColor: '#000', marginTop: 20 }}
        >
          <Text style={{ color: '#fff', textAlign: 'center' }}>
            Add Expense
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}
