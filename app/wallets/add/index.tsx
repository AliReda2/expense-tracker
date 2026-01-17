import { insertWallet } from '@/lib/db';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
// Import TextInput from Paper, not react-native
import { Button, TextInput } from 'react-native-paper';

const AddWallet = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');

  const handleSave = async () => {
    // 1. Basic validation check
    if (!name.trim()) {
      alert('Please enter a wallet name');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      await insertWallet(name, numAmount);
      // 2. Use router.back() to return to the list
      router.back();
    } catch (error) {
      console.error('Save failed', error);
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
      />

      <TextInput
        label="Initial Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        mode="outlined"
        style={styles.input}
        outlineColor="#ccc"
        activeOutlineColor="#ff8c00"
      />

      <Button
        mode="contained"
        onPress={handleSave}
        style={styles.button}
        disabled={!name || !amount} // Prevent clicks if empty
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
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    backgroundColor: '#ff8c00',
    paddingVertical: 5,
  },
});

export default AddWallet;
