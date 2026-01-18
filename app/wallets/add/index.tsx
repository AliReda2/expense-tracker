import { CURRENCIES } from '@/constants/currencies';
import { insertWallet } from '@/lib/db';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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

const AddWallet = () => {
  const router = useRouter();

  // State
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD'); // Default currency
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false); // Modal visibility

  const handleCurrencySelect = (code: string) => {
    setCurrency(code);
    setShowCurrencyPicker(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a wallet name');
      return;
    }

    const numAmount = parseFloat(amount) || 0;

    try {
      // 2. Pass currency to your insert function
      await insertWallet(name, numAmount, currency);
      router.back();
    } catch (error) {
      console.error('Save failed', error);
      Alert.alert('Error', 'Wallet name must be unique');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Wallet Name (e.g. Cash, Bank)"
        value={name}
        onChangeText={setName}
        mode="outlined"
        style={styles.input}
        outlineColor="#ccc"
        activeOutlineColor="#ff8c00"
        theme={{
          colors: {
            onSurfaceVariant: '#9b9b9b', // Colors the label when not focused
            primary: '#ff8c00', // Colors the label/outline when focused
          },
        }}
      />

      <View style={styles.row}>
        {/* Currency Selector */}
        <Pressable
          style={styles.currencyButton}
          onPress={() => setShowCurrencyPicker(true)}
        >
          <Text style={styles.currencyButtonText}>{currency}</Text>
        </Pressable>

        {/* Amount Input */}
        <TextInput
          label="Initial Amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          mode="outlined"
          style={[styles.input, { flex: 1 }]}
          outlineColor="#ccc"
          activeOutlineColor="#ff8c00"
          theme={{
            colors: {
              onSurfaceVariant: '#9b9b9b', // Colors the label when not focused
              primary: '#ff8c00', // Colors the label/outline when focused
            },
          }}
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
        disabled={!name}
        textColor="#ffffff"
        contentStyle={{ flexDirection: 'row-reverse' }}
      >
        Save Wallet
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: '#fff',
  },
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
  input: {
    backgroundColor: '#fff',
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    backgroundColor: '#ff8c00',
    paddingVertical: 5,
  },
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

export default AddWallet;
