import { Dimensions, Text, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

interface ChartProps {
  expenses: { dollarAmount: number; date: string }[];
}

export default function MonthlyChart({ expenses }: ChartProps) {
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  // Grouping logic
  const dailyTotals = expenses.reduce(
    (acc, curr) => {
      const day = parseInt(curr.date.split('-')[2], 10);
      acc[day] = (acc[day] || 0) + curr.dollarAmount;
      return acc;
    },
    {} as Record<number, number>
  );

  const dataValues = daysInMonth.map((day) => dailyTotals[day] || 0);

  const barColors = daysInMonth.map(() => {
    return (opacity = 1) => `rgba(0, 123, 255, ${opacity})`;
  });

  return (
    <View
      style={{ alignItems: 'center', paddingHorizontal: 16, marginTop: 16 }}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: '600',
          color: '#666',
          marginBottom: 12,
          alignSelf: 'flex-start',
        }}
      >
        Daily Spending
      </Text>
      <BarChart
        {...({
          data: {
            labels: daysInMonth.map((d) =>
              d % 5 === 0 || d === 1 ? d.toString() : ''
            ),
            datasets: [
              {
                data: dataValues,
                colors: barColors,
              },
            ],
          },
          width: Dimensions.get('window').width - 32,
          height: 220,
          yAxisLabel: '$',
          yAxisSuffix: '',
          fromZero: true,
          flatColor: true,
          withCustomBarColorFromData: true,
          chartConfig: {
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            barPercentage: 0.3,
            propsForLabels: { fontSize: 10 },
          },
          style: { marginVertical: 8, borderRadius: 16 },
        } as any)}
      />
    </View>
  );
}
