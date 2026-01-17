import { fetchWallets } from '@/lib/db';
import { Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type Wallet = {
  id: number;
  name: string;
  amount: number;
};

const WalletsContainer = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);

  const loadData = async () => {
    try {
      const data = await fetchWallets();
      // Ensure data is an array, otherwise fallback to empty array
      setWallets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
      setWallets([]); // Fallback on error
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <Link href="/wallets" asChild>
      <TouchableOpacity
        style={{
          padding: 15,
          backgroundColor: '#f9f9f9',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#eee',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <Text style={{ fontWeight: 'bold', color: '#666' }}>MY WALLETS</Text>
          <Text style={{ color: '#ff8c00' }}>See All →</Text>
        </View>{' '}
        {/* Use Array.isArray and length check together */}
        {Array.isArray(wallets) && wallets.length > 0 ? (
          wallets.map((wallet) => (
            <View key={wallet.id} style={{ marginBottom: 10 }}>
              <Text style={{ fontWeight: 'bold' }}>{wallet.name}</Text>
              <Text>{wallet.amount}</Text>
            </View>
          ))
        ) : (
          <View>
            <Text>No Wallets Found</Text>
          </View>
        )}
      </TouchableOpacity>
    </Link>
  );
};

export default WalletsContainer;
