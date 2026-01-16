import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { IconButton } from 'react-native-paper';
import ExpenseCard from './ExpenseCard';

// Define the Props interface for TypeScript safety
interface SwipeableRowProps {
  item: {
    id: number;
    amount: number;
    note: string;
    date: string;
  };
  onDelete: (id: number) => void;
  onPress: () => void; // Added this property
}

const renderRightActions = (id: number, onDelete: (id: number) => void) => {
  return (
    <View style={styles.deleteContainer}>
      <IconButton
        icon="trash-can"
        iconColor="white"
        size={24}
        onPress={() => onDelete(id)}
      />
    </View>
  );
};

export const SwipeableExpenseRow = ({
  item,
  onDelete,
  onPress,
}: SwipeableRowProps) => {
  return (
    <Swipeable
      renderRightActions={() => renderRightActions(item.id, onDelete)}
      overshootRight={false}
    >
      {/* Wrap the card in a Pressable to trigger the Edit navigation */}
      <Pressable onPress={onPress}>
        <ExpenseCard amount={item.amount} note={item.note} date={item.date} />
      </Pressable>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  deleteContainer: {
    backgroundColor: '#dd2c00',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 8, // Match your ExpenseCard rounding
    marginVertical: 4, // Match your ExpenseCard margin
  },
});
