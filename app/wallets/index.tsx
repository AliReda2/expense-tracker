import { fetchWallets } from '@/lib/db';
import { Link } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Wallet = {
  id: number;
  name: string;
  amount: number;
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

  useEffect(() => {
    loadData();
  }, []);

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
              <Text style={styles.walletName}>{wallet.name}</Text>
              <Text>Amount: ${wallet.amount}</Text>
              <Link href={`/wallets/edit/${wallet.id}`} asChild>
                <Pressable>
                  <Text>Edit</Text>
                </Pressable>
              </Link>
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
  container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa' },
  emptyCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  walletName: {
    fontSize: 18,
    fontWeight: 'bold',
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
});

export default Wallets;
