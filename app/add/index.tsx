import { CURRENCIES } from '@/constants/currencies';
import { insertExpense, updateExpense } from '@/lib/db';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Text, TextInput } from 'react-native-paper';

export default function AddExpense() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isEditing = !!params.id;

  const categories = [
    'Food',
    'Transport',
    'Bills',
    'Entertainment',
    'Loan',
    'General',
  ];

  // --- STATE ---
  const [category, setCategory] = useState(
    params.category ? (params.category as string) : 'General',
  );

  // Initialize currency from params (if editing) or default to USD
  const [currency, setCurrency] = useState(
    params.currency ? (params.currency as string) : 'USD',
  );

  const [amount, setAmount] = useState(
    params.amount ? (params.amount as string) : '',
  );

  const [note, setNote] = useState(params.note ? (params.note as string) : '');

  // --- SAVE HANDLER ---
  const handleSave = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    if (isEditing) {
      await updateExpense(
        Number(params.id),
        numAmount,
        note,
        params.date as string,
        category,
        currency,
      );
    } else {
      const today = new Date().toISOString().split('T')[0];
      await insertExpense(numAmount, note, today, category, currency); // Added currency
    }
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* AMOUNT INPUT */}
      <TextInput
        label={`Amount (${currency})`}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        mode="outlined"
        textColor="#000"
        style={styles.input}
        left={<TextInput.Affix text={currency} textStyle={{ color: '#000' }} />}
        theme={{
          colors: {
            onSurfaceVariant: '#9b9b9b',
            primary: '#ff8c00',
          },
        }}
      />

      {/* NOTE INPUT */}
      <TextInput
        label="Note"
        value={note}
        onChangeText={setNote}
        mode="outlined"
        textColor="#000"
        style={styles.input}
        theme={{
          colors: {
            onSurfaceVariant: '#9b9b9b',
            primary: '#ff8c00',
          },
        }}
      />

      {/* CURRENCY SELECTION */}
      <Text style={styles.label}>Currency</Text>
      <View style={styles.scrollContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {CURRENCIES.map((curr) => (
            <Chip
              key={curr.code}
              selected={currency === curr.code}
              onPress={() => setCurrency(curr.code)}
              style={styles.chip}
              showSelectedOverlay
            >
              {curr.code} ({curr.symbol})
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* CATEGORY SELECTION */}
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
    marginTop: 5,
    color: '#333',
  },
  // Container for horizontal scrolling sections
  scrollContainer: {
    marginBottom: 15,
    height: 40, // Constrain height to prevent layout jumps
  },
  scrollContent: {
    gap: 8, // Spacing between items in ScrollView
    paddingRight: 20, // Padding at the end of scroll
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 8,
  },
  chip: {
    marginBottom: 8,
  },
  button: { marginTop: 20, paddingVertical: 8 },
});
