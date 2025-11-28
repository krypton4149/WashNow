import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { platformEdges } from '../../utils/responsive';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  onBack?: () => void;
  onProceedToPayment?: (bookingData?: { date: string; time: string }) => void;
  acceptedCenter?: any;
}

const BookingConfirmedScreen: React.FC<Props> = ({ 
  onBack, 
  onProceedToPayment, 
  acceptedCenter = {
    id: '1',
    name: 'Premium Auto Wash',
    rating: 4.8,
    distance: '0.5 mi',
    address: 'Downtown, New York - 123 Main Street',
  }
}) => {
  const { isDarkMode, colors } = useTheme();
  
  // Map theme colors to component-specific theme object
  const theme = {
    background: colors.background,
    textPrimary: colors.text,
    textSecondary: colors.textSecondary,
    border: colors.border,
    card: colors.card,
    surface: colors.surface,
    accent: colors.button,
  };
  // Get current date and time for instant booking
  const now = new Date();
  const dateString = now.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  
  // Format time for API (24-hour format)
  const getCurrentTime = (d: Date) => {
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;
  };
  
  // Prepare booking data with current date/time for instant booking
  const instantBookingData = {
    date: now.toISOString(),
    time: getCurrentTime(now),
  };
  return (
    <SafeAreaView style={[styles.container,{ backgroundColor: theme.background }]} edges={platformEdges as any}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="close" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.title,{color: theme.textPrimary}]}>Finding your car wash</Text>
          <Text style={[styles.subtitle,{color: theme.textSecondary}]}>Broadcasting to all nearby centers</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Match Found Banner */}
        <View style={[styles.matchFoundBanner,{ backgroundColor: theme.card }]}>
          <View style={[styles.matchIcon, { backgroundColor: theme.accent }]}>
            <Ionicons name="checkmark" size={16} color={colors.buttonText} />
            <View style={[styles.clockIcon, { backgroundColor: theme.accent }]}>
              <Ionicons name="time" size={8} color={colors.buttonText} />
            </View>
          </View>
          <View style={styles.matchContent}>
            <Text style={[styles.matchText,{color: theme.textPrimary}]}>Match found!</Text>
            <Text style={[styles.matchTime,{color: theme.textSecondary}]}>Time elapsed: 0:07</Text>
          </View>
        </View>

        {/* Booking Confirmed */}
        <View style={styles.confirmationSection}>
          <View style={[styles.confirmationIcon, { backgroundColor: theme.accent }]}>
            <Ionicons name="checkmark" size={48} color={colors.buttonText} />
          </View>
          <Text style={[styles.confirmationTitle,{color: theme.textPrimary}]}>Booking Confirmed!</Text>
          <Text style={[styles.confirmationSubtitle,{color: theme.textSecondary}] }>
            {acceptedCenter.name} accepted your request
          </Text>
        </View>

        {/* Car Wash Details */}
        <View style={styles.detailsSection}>
          <Text style={[styles.detailsTitle,{color: theme.textPrimary}]}>Your Car Wash Details</Text>
          <View style={[styles.detailsCard,{ backgroundColor: theme.card }]}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel,{color: theme.textSecondary}]}>Center:</Text>
              <Text style={[styles.detailValue,{color: theme.textPrimary}]}>{acceptedCenter.name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel,{color: theme.textSecondary}]}>Date:</Text>
              <Text style={[styles.detailValue,{color: theme.textPrimary}]}>{dateString}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel,{color: theme.textSecondary}]}>Distance:</Text>
              <Text style={[styles.detailValue,{color: theme.textPrimary}]}>{acceptedCenter.distance}</Text>
            </View>
          </View>
        </View>

        {/* Next Step Instructions removed as requested */}
      </View>

      {/* Proceed to Payment Button */}
      <View style={[styles.bottomContainer,{ backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <TouchableOpacity style={[styles.paymentButton, { backgroundColor: theme.accent }]} onPress={() => onProceedToPayment?.(instantBookingData)}>
          <Text style={[styles.paymentButtonText, { color: colors.buttonText }]}>Proceed to Payment</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  matchFoundBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
  },
  matchIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  clockIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchContent: {
    flex: 1,
  },
  matchText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  matchTime: {
    fontSize: 14,
    color: '#666666',
  },
  confirmationSection: {
    alignItems: 'center',
    marginVertical: 40,
  },
  confirmationIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  confirmationSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  detailsCard: {
    backgroundColor: '#D1FAE5',
    padding: 16,
    borderRadius: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  instructionsSection: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  instructionsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  bottomContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  paymentButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  paymentButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BookingConfirmedScreen;
