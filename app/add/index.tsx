import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, Text, TextInput } from 'react-native-paper';
import { insertExpense, updateExpense } from '../../lib/db';

export default function AddExpense() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isEditing = !!params.id;

  const categories = ['Food', 'Transport', 'Bills', 'Entertainment', 'General'];
  const [category, setCategory] = useState(
    params.category ? (params.category as string) : 'General'
  );
  const [amount, setAmount] = useState(
    params.amount ? (params.amount as string) : ''
  );
  const [note, setNote] = useState(params.note ? (params.note as string) : '');

  const handleSave = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    if (isEditing) {
      await updateExpense(
        Number(params.id),
        numAmount,
        note,
        params.date as string,
        category
      );
    } else {
      const today = new Date().toISOString().split('T')[0];
      await insertExpense(numAmount, note, today, category);
    }
    router.back();
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Note"
        value={note}
        onChangeText={setNote}
        mode="outlined"
        style={styles.input}
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.categoryContainer}>
        {categories.map((cat) => (
          <Chip
            key={cat}
            selected={category === cat}
            onPress={() => setCategory(cat)}
            style={styles.chip}
          >
            {cat}
          </Chip>
        ))}
      </View>

      <Button
        mode="contained"
        onPress={handleSave}
        style={styles.button}
        buttonColor="#ff8c00"
      >
        {isEditing ? 'Update' : 'Save'}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, backgroundColor: '#f8f9fa' },
  input: { marginBottom: 15, backgroundColor: '#fff' },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
    color: '#333',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 8,
  },
  chip: { marginBottom: 8 },
  button: { marginTop: 20, paddingVertical: 8 },
});
