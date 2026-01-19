import { deleteWallet, fetchWallets } from '@/lib/db';
import { formatMoney } from '@/utils/formatMoney';
import { Link, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { IconButton } from 'react-native-paper';

type Wallet = {
  id: number;
  name: string;
  amount: number;
  currency: string;
};

const Wallets = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const data = await fetchWallets();
    setWallets(data as Wallet[]);
  };

  // The function triggered on swipe down
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const handleDelete = async (id: number) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to remove this record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteWallet(id);
            loadData(); // Refresh all state
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={wallets.length === 0 && styles.emptyCenter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#ff8c00']} // Android spinner color
            tintColor="#ff8c00" // iOS spinner color
          />
        }
      >
        {wallets.length > 0 ? (
          wallets.map((wallet) => (
            <View key={wallet.id} style={styles.walletItem}>
              <View>
                <Text style={styles.walletName}>{wallet.name}</Text>
                <Text>
                  Amount: {formatMoney(wallet.amount, wallet.currency)}
                </Text>
              </View>
              <View style={styles.walletActions}>
                <Link href={`/wallets/edit/${wallet.id}`} asChild>
                  <Pressable style={styles.editContainer}>
                    <Text>Edit</Text>
                  </Pressable>
                </Link>
                <Pressable style={styles.deleteContainer}>
                  <IconButton
                    icon="trash-can"
                    iconColor="white"
                    size={24}
                    onPress={() => handleDelete(wallet.id)}
                  />
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <Text>No wallets found. Swipe down to refresh.</Text>
        )}
      </ScrollView>

      <Link href={'/wallets/add'} asChild>
        <Pressable style={styles.fab}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </Link>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  emptyCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletItem: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  walletName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  walletActions: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: { color: '#fff', fontSize: 32, fontWeight: '300' },
  deleteContainer: {
    backgroundColor: '#dd2c00',
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  editContainer: {
    backgroundColor: '#16df20',
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    borderRadius: 8,
  },
});

export default Wallets;
