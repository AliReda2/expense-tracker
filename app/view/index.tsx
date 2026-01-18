import { SwipeableExpenseRow } from '@/components/SwipeableExpenseRow';
import { useRefresh } from '@/hooks/useRefresh';
import { deleteExpense, fetchFilteredExpenses } from '@/lib/db';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Chip, TextInput } from 'react-native-paper';

type Expense = {
  id: number;
  amount: number;
  note: string;
  date: string;
  category: string;
};

const ViewExpenses = () => {
  const router = useRouter();

  const [expenses, setExpenses] = useState<Expense[]>([]);

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
  };

  const { refreshing, onRefresh } = useRefresh(loadData);

  useEffect(() => {
    loadData();
  }, [filterCategory, minAmount]);
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
            await deleteExpense(id);
            loadData(); // Refresh all state
          },
        },
      ]
    );
  };
  return (
    <View style={styles.container}>
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
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#ff8c00']}
            tintColor="#ff8c00"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="inbox-outline"
              size={80}
              color="#ccc"
            />
            <Text style={styles.emptyTitle}>No Expenses Found</Text>
            <Text style={styles.emptySubtitle}>
              {filterCategory === 'All' && !minAmount
                ? 'Start tracking your expenses to see them here'
                : 'Try adjusting your filters'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <SwipeableExpenseRow
            item={item}
            onDelete={() => handleDelete(item.id)}
            onPress={() =>
              router.push({
                pathname: '/add',
                params: {
                  id: item.id,
                  amount: item.amount.toString(),
                  note: item.note,
                  date: item.date,
                  category: item.category,
                },
              })
            }
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8f9fa' },
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
  filterSection: { marginBottom: 15, paddingHorizontal: 16 },
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6c757d',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#adb5bd',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default ViewExpenses;
