import { fetchWalletById, updateWallet } from '@/lib/db';
import { useLocalSearchParams, useRouter } from 'expo-router'; // 1. Use useLocalSearchParams
import React, { useEffect, useState } from 'react'; // 2. Add useEffect
import { Alert, StyleSheet, View } from 'react-native';
import { Button, TextInput } from 'react-native-paper';

const EditWallet = () => {
  const router = useRouter();
  const param = useLocalSearchParams<{ id: string }>(); // 3. Correctly get the ID param
  const id = parseFloat(param.id);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');

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
      }
    } catch (error) {
      console.error('Failed to load wallet:', error);
      Alert.alert('Error', 'Could not load wallet details.');
    }
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
      await updateWallet(id, name, numAmount);
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

      <TextInput
        label="Amount"
        value={amount} // 7. Use the amount state directly
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
        disabled={!name || !amount}
      >
        Update Wallet
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, backgroundColor: '#fff' },
  input: { marginBottom: 15 },
  button: { marginTop: 10, backgroundColor: '#ff8c00', paddingVertical: 5 },
});

export default EditWallet;
