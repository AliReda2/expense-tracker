import { formatMoney } from '@/utils/formatMoney';
import { Text, View } from 'react-native';

type Expense = {
  amount: number;
  currency: string;
  note: string;
  date: string;
};

export default function ExpenseCard({ amount, currency, note, date }: Expense) {
  return (
    <View
      style={{
        padding: 16,
        marginVertical: 8,
        borderRadius: 16,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
        {formatMoney(amount, currency)}
      </Text>
      <Text style={{ color: '#555', marginTop: 4 }}>{note}</Text>
      <Text style={{ color: '#999', marginTop: 4, fontSize: 12 }}>
        {new Date(date).toLocaleDateString()}
      </Text>
    </View>
  );
}
