import { format } from 'date-fns';
import { Dimensions, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

interface ChartProps {
  expenses: { amount: number; date: string }[];
  onDayPress: (date: string) => void;
  selectedDate: string | null; // Added prop to track selection
}

export default function MonthlyChart({
  expenses,
  onDayPress,
  selectedDate,
}: ChartProps) {
  const now = new Date();
  const yearMonth = format(now, 'yyyy-MM');

  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  // Grouping logic
  const dailyTotals = expenses.reduce((acc, curr) => {
    const day = parseInt(curr.date.split('-')[2], 10);
    acc[day] = (acc[day] || 0) + curr.amount;
    return acc;
  }, {} as Record<number, number>);

  const dataValues = daysInMonth.map((day) => dailyTotals[day] || 0);

  // --- HIGHLIGHT LOGIC ---
  // Create an array of color functions, one for each bar
  const barColors = daysInMonth.map((day) => {
    const dayPadded = day.toString().padStart(2, '0');
    const fullDate = `${yearMonth}-${dayPadded}`;

    // If this bar's date matches the selectedDate, highlight it orange
    if (fullDate === selectedDate) {
      return (opacity = 1) => `rgba(255, 140, 0, ${opacity})`; // #ff8c00
    }
    // Otherwise, use the default blue
    return (opacity = 1) => `rgba(0, 123, 255, ${opacity})`;
  });

  const handleBarPress = (data: any) => {
    const day = daysInMonth[data.index];
    const dayPadded = day.toString().padStart(2, '0');
    const fullDate = `${yearMonth}-${dayPadded}`;
    onDayPress(fullDate);
  };

  return (
    <View style={{ alignItems: 'center' }}>
      <BarChart
        {...({
          data: {
            labels: daysInMonth.map((d) =>
              d % 5 === 0 || d === 1 ? d.toString() : ''
            ),
            datasets: [
              {
                data: dataValues,
                colors: barColors, // Pass the array of color functions here
              },
            ],
          },
          width: Dimensions.get('window').width - 32,
          height: 220,
          yAxisLabel: '$',
          yAxisSuffix: '',
          fromZero: true,
          flatColor: true, // Required for individual bar colors to work correctly
          withCustomBarColorFromData: true, // Required for individual bar colors
          onDataPointClick: handleBarPress,
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
