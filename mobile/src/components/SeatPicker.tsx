import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface SeatPickerProps {
  value: number;
  onChange: (newValue: number) => void;
  minSeats?: number;
  maxSeats?: number;
}

export const SeatPicker: React.FC<SeatPickerProps> = ({
  value,
  onChange,
  minSeats = 1,
  maxSeats = 10,
}) => {
  const { colors } = useTheme();

  const handleDecrement = () => {
    if (value > minSeats) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < maxSeats) {
      onChange(value + 1);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>Number of Trekkers / Seats</Text>
      <View style={[styles.controls, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
        <TouchableOpacity
          onPress={handleDecrement}
          disabled={value <= minSeats}
          style={[styles.button, { backgroundColor: colors.surface }, value <= minSeats && { opacity: 0.4 }]}
        >
          <Text style={[styles.btnText, { color: colors.text }]}>-</Text>
        </TouchableOpacity>
        <Text style={[styles.countText, { color: colors.text }]}>{value}</Text>
        <TouchableOpacity
          onPress={handleIncrement}
          disabled={value >= maxSeats}
          style={[styles.button, { backgroundColor: colors.surface }, value >= maxSeats && { opacity: 0.4 }]}
        >
          <Text style={[styles.btnText, { color: colors.text }]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 20,
    fontWeight: '700',
  },
  countText: {
    fontSize: 18,
    fontWeight: '700',
  },
});
