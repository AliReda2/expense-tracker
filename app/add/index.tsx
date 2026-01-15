import { insertExpense } from '@/lib/db';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, TextInput, View } from 'react-native';

export default function AddExpense() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const submit = async () => {
    if (!amount) return;
    await insertExpense(parseFloat(amount), note, new Date().toISOString());
    router.back();
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Amount"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
      />

      <TextInput
        placeholder="Note"
        value={note}
        onChangeText={setNote}
        style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
      />

      <Button title="Save Expense" onPress={submit} />
    </View>
  );
}
