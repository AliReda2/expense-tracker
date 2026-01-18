import { fetchWallets, initDB } from '@/lib/db';
import { formatMoney } from '@/utils/formatMoney';
import { Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type Wallet = {
  id: number;
  name: string;
  amount: number;
  currency: string;
};

const WalletsContainer = ({ refreshing }: { refreshing?: boolean }) => {
  const [wallets, setWallets] = useState<Wallet[]>([]);

  const loadData = async () => {
    try {
      await initDB(); // Ensure DB is initialized
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

  useEffect(() => {
    if (refreshing) {
      loadData();
    }
  }, [refreshing]);

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
        </View>
        {/* Use Array.isArray and length check together */}
        {Array.isArray(wallets) && wallets.length > 0 ? (
          wallets.map((wallet) => (
            <View
              key={wallet.id}
              style={{
                marginBottom: 12,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontWeight: '600', color: '#333', fontSize: 15 }}>
                {wallet.name}
              </Text>
              <Text
                style={{ fontWeight: 'bold', color: '#ff8c00', fontSize: 16 }}
              >
                {formatMoney(wallet.amount, wallet.currency)}
              </Text>
            </View>
          ))
        ) : (
          <View>
            <Text
              style={{
                color: '#999',
                textAlign: 'center',
                paddingVertical: 10,
              }}
            >
              No Wallets Found
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Link>
  );
};

export default WalletsContainer;
