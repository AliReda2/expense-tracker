import { CURRENCIES } from '@/constants/currencies';
import { fetchWallets, updateExpense } from '@/lib/db';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Text, TextInput } from 'react-native-paper';

type Wallet = {
  id: number;
  name: string;
  amount: number;
  currency: string;
};

// Screen dedicated to editing an existing expense
export default function EditExpense() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isEditing = true;

  const categories = [
    'Food',
    'Transport',
    'Bills',
    'Entertainment',
    'Loan',
    'General',
  ];

  // --- STATE ---
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<number | null>(
    params.walletId ? Number(params.walletId) : null,
  );

  const [category, setCategory] = useState(
    params.category ? (params.category as string) : 'General',
  );

  const [currency, setCurrency] = useState(
    params.currency ? (params.currency as string) : 'USD',
  );

  const [amount, setAmount] = useState(
    params.amount ? (params.amount as string) : '',
  );

  const [note, setNote] = useState(params.note ? (params.note as string) : '');

  // --- LOAD WALLETS ---
  useEffect(() => {
    async function loadWallets() {
      const result = await fetchWallets();
      setWallets(result);

      // For the edit screen, do not override an explicitly selected wallet
      if (!isEditing && !selectedWalletId && result.length > 0) {
        setSelectedWalletId(result[0].id);
      }
    }
    loadWallets();
  }, []);

  // --- UPDATE HANDLER ---
  const handleUpdate = async () => {
    const numAmount = parseFloat(amount);

    if (!params.id) {
      Alert.alert('Missing Expense', 'Cannot update expense: missing id.');
      return;
    }

    // Validation
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive number.');
      return;
    }
    if (selectedWalletId === null) {
      Alert.alert(
        'No Wallet',
        'Please select a wallet to deduct this expense from.',
      );
      return;
    }

    await updateExpense(
      Number(params.id),
      numAmount,
      note,
      (params.date as string) ?? new Date().toISOString().split('T')[0],
      category,
      currency,
      selectedWalletId,
    );

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

      {/* WALLET SELECTION */}
      <Text style={styles.label}>Wallet</Text>
      <View style={styles.scrollContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {wallets.map((wallet) => (
            <Chip
              key={wallet.id}
              selected={selectedWalletId === wallet.id}
              onPress={() => setSelectedWalletId(wallet.id)}
              style={styles.chip}
              showSelectedOverlay
            >
              {wallet.name} ({wallet.currency})
            </Chip>
          ))}
        </ScrollView>
      </View>

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
        onPress={handleUpdate}
        style={styles.button}
        buttonColor="#ff8c00"
      >
        Update
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
    height: 40,
  },
  scrollContent: {
    gap: 8,
    paddingRight: 20,
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
