import { format } from 'date-fns';
import { Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import MonthlyChart from '@/components/MonthlyChart';
import {
  fetchFilteredExpenses,
  getDailyTotal,
  getMonthlyTotal,
} from '../lib/db';

import WalletsContainer from '@/components/WalletsContainer';
import { Button, Chip, TextInput } from 'react-native-paper';

type Expense = {
  id: number;
  amount: number;
  note: string;
  date: string;
  category: string;
};

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [monthTotal, setMonthTotal] = useState(0);

  const [filterCategory, setFilterCategory] = useState('All');
  const [minAmount, setMinAmount] = useState('');

  const categories = [
    'All',
    'Food',
    'Transport',
    'Bills',
    'Entertainment',
    'Loan',
    'General',
  ];

  const loadData = async () => {
    const cleanMinInput = minAmount.trim() === '' ? undefined : minAmount;

    const parsedAmount = cleanMinInput ? parseFloat(cleanMinInput) : undefined;

    const data = await fetchFilteredExpenses({
      category: filterCategory,
      // 3. Final validation check
      minAmount:
        typeof parsedAmount === 'number' && !isNaN(parsedAmount)
          ? parsedAmount
          : undefined,
    });

    setExpenses(data as Expense[]);

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const monthPrefix = format(new Date(), 'yyyy-MM');
    const [daily, monthly] = await Promise.all([
      getDailyTotal(todayStr),
      getMonthlyTotal(monthPrefix),
    ]);
    setTodayTotal(daily);
    setMonthTotal(monthly);
  };

  useEffect(() => {
    loadData();
  }, [filterCategory, minAmount]);

  const resetFilters = () => {
    setFilterCategory('All');
    setMinAmount('');
  };
  const isFiltered = filterCategory !== 'All' || minAmount !== '';

  return (
    <View style={styles.container}>
      {/* wallets */}
      <View style={{ marginBottom: 20 }}>
        <WalletsContainer />
      </View>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Today</Text>
          <Text style={styles.summaryValue}>${todayTotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>This Month</Text>
          <Text style={styles.summaryValue}>${monthTotal.toFixed(2)}</Text>
        </View>
      </View>

      {/* 2. Filter Section */}
      <View style={styles.filterHeader}>
        <Text style={styles.sectionTitle}>Filters</Text>
        {isFiltered && (
          <Button
            mode="text"
            compact
            onPress={resetFilters}
            textColor="#ff8c00"
          >
            Clear All
          </Button>
        )}
      </View>

      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
        >
          {categories.map((cat) => (
            <Chip
              key={cat}
              selected={filterCategory === cat}
              onPress={() => setFilterCategory(cat)}
              style={styles.chip}
            >
              {cat}
            </Chip>
          ))}
        </ScrollView>

        <TextInput
          placeholder="Min Amount"
          value={minAmount}
          onChangeText={setMinAmount}
          keyboardType="numeric"
          mode="outlined"
          dense
          style={styles.minAmountInput}
          right={
            minAmount ? (
              <TextInput.Icon icon="close" onPress={() => setMinAmount('')} />
            ) : null
          }
        />
      </View>

      <MonthlyChart expenses={expenses} />

      <Link href="/view" asChild>
        <Pressable style={styles.viewButton}>
          <Text style={styles.viewButtonText}>View All Expenses</Text>
        </Pressable>
      </Link>
      <Link href="/add" asChild>
        <Pressable style={styles.fab}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa' },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryBox: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    width: '48%',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryLabel: { color: '#6c757d', fontSize: 14, marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: 'bold', color: '#212529' },
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
  filterSection: { marginBottom: 15 },
  categoryScroll: { marginBottom: 10 },
  chip: { marginRight: 8 },
  minAmountInput: { height: 40, backgroundColor: '#fff' },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
  },
  activeDateChip: {
    backgroundColor: '#fff4e5', // Light orange background
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  viewButton: {
    backgroundColor: '#ff8c00',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
