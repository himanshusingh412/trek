import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/Button';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from '../navigation/types';

type Props = StackScreenProps<AuthStackParamList, 'Onboarding'>;

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Explore the Great Himalayas',
    subtitle: 'Discover hand-curated trek routes from Kedarkantha to Roopkund with expert certified local guides.',
  },
  {
    id: '2',
    title: 'Instant Seat Holds & Simple Booking',
    subtitle: 'Lock your departure seats instantly. Complete payment securely via Razorpay with 100% price transparency.',
  },
  {
    id: '3',
    title: 'Real-Time Snow & Weather Updates',
    subtitle: 'Get live trail alerts, gear checklists, and offline itinerary updates directly on your device.',
  },
];

export const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      navigation.navigate('Login');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.skipContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.slideContainer}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.iconText, { color: colors.primary }]}>
            {currentIndex === 0 ? '🏔️' : currentIndex === 1 ? '🏕️' : '❄️'}
          </Text>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{SLIDES[currentIndex].title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {SLIDES[currentIndex].subtitle}
        </Text>
      </View>

      <View style={styles.dotsRow}>
        {SLIDES.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.dot,
              {
                backgroundColor: idx === currentIndex ? colors.primary : colors.border,
                width: idx === currentIndex ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Button
          title={currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          onPress={handleNext}
          variant="primary"
          size="large"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  skipContainer: {
    alignItems: 'flex-end',
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
  },
  slideContainer: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconText: {
    fontSize: 48,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  footer: {
    width: '100%',
  },
});
