import { CURRENCIES } from '@/constants/currencies';
import { fetchWalletById, updateWallet } from '@/lib/db';
import { useLocalSearchParams, useRouter } from 'expo-router'; // 1. Use useLocalSearchParams
import React, { useEffect, useState } from 'react'; // 2. Add useEffect
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, TextInput } from 'react-native-paper';

const EditWallet = () => {
  const router = useRouter();
  const param = useLocalSearchParams<{ id: string }>(); // 3. Correctly get the ID param
  const id = parseFloat(param.id);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  // 4. Use useEffect to call loadData when the component mounts
  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      const data = await fetchWalletById(id);
      if (data) {
        setName(data.name);
        setAmount(data.amount.toString()); // TextInput requires a string
        setCurrency(data.currency || 'USD');
      }
    } catch (error) {
      console.error('Failed to load wallet:', error);
      Alert.alert('Error', 'Could not load wallet details.');
    }
  };

  const handleCurrencySelect = (code: string) => {
    setCurrency(code);
    setShowCurrencyPicker(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Please enter a wallet name');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      Alert.alert('Validation', 'Please enter a valid amount');
      return;
    }

    try {
      // 5. id is a string from params, updateWallet usually expects the ID first
      await updateWallet(id, name, numAmount, currency);
      router.back();
    } catch (error) {
      console.error('Save failed', error);
      Alert.alert('Error', 'Failed to save wallet changes.');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Wallet Name"
        value={name} // 6. Use the name state directly
        onChangeText={setName}
        mode="outlined"
        style={styles.input}
        outlineColor="#ccc"
        activeOutlineColor="#ff8c00"
      />

      <View style={styles.row}>
        {/* Currency Selector */}
        <Pressable
          style={styles.currencyButton}
          onPress={() => setShowCurrencyPicker(true)}
        >
          <Text style={styles.currencyButtonText}>{currency}</Text>
        </Pressable>

        <TextInput
          label="Amount"
          value={amount} // 7. Use the amount state directly
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          mode="outlined"
          style={[styles.input, { flex: 1 }]}
          outlineColor="#ccc"
          activeOutlineColor="#ff8c00"
        />
      </View>

      {/* Currency Picker Modal */}
      <Modal
        visible={showCurrencyPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCurrencyPicker(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowCurrencyPicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Currency</Text>
            <FlatList
              data={CURRENCIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.currencyOption,
                    currency === item.code && styles.currencyOptionSelected,
                  ]}
                  onPress={() => handleCurrencySelect(item.code)}
                >
                  <Text style={styles.currencyOptionText}>
                    {item.symbol} {item.code} - {item.name}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>

      <Button
        mode="contained"
        onPress={handleSave}
        style={styles.button}
        disabled={!name || !amount}
      >
        Update Wallet
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, backgroundColor: '#fff' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  currencyButton: {
    height: 55,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
  },
  currencyButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  input: { marginBottom: 15 },
  button: { marginTop: 10, backgroundColor: '#ff8c00', paddingVertical: 5 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '80%',
    width: '80%',
    paddingTop: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    marginBottom: 12,
    color: '#333',
  },
  currencyOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  currencyOptionSelected: {
    backgroundColor: '#fff4e5',
  },
  currencyOptionText: {
    fontSize: 15,
    color: '#333',
  },
});

export default EditWallet;
