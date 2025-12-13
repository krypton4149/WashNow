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
import { FONTS, FONT_SIZES } from '../../utils/fonts';

const BLUE_COLOR = '#0358a8';

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
      <View style={[styles.header, { borderBottomColor: '#E5E7EB' }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color="#000000" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: '#000000' }]}>Finding your car wash</Text>
          <Text style={[styles.subtitle, { color: '#666666' }]}>Broadcasting to all nearby centers</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Booking Confirmed */}
        <View style={styles.confirmationSection}>
          <View style={[styles.confirmationIcon, { backgroundColor: BLUE_COLOR }]}>
            <Ionicons name="checkmark" size={52} color="#FFFFFF" />
          </View>
          <Text style={[styles.confirmationTitle, { color: '#000000' }]}>Booking Confirmed!</Text>
          <Text style={[styles.confirmationSubtitle, { color: '#666666' }]}>
            {acceptedCenter.name} accepted your request
          </Text>
        </View>

        {/* Car Wash Details */}
        <View style={styles.detailsSection}>
          <Text style={[styles.detailsTitle, { color: '#000000' }]}>Your Car Wash Details</Text>
          <View style={[styles.detailsCard, { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB', borderWidth: 1 }]}>
            <View style={[styles.detailRow, styles.detailRowWithBorder]}>
              <Text style={[styles.detailLabel, { color: '#666666' }]}>Center:</Text>
              <Text style={[styles.detailValue, { color: '#000000' }]}>{acceptedCenter.name}</Text>
            </View>
            <View style={[styles.detailRow, styles.detailRowWithBorder]}>
              <Text style={[styles.detailLabel, { color: '#666666' }]}>Date:</Text>
              <Text style={[styles.detailValue, { color: '#000000' }]}>{dateString}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: '#666666' }]}>Distance:</Text>
              <Text style={[styles.detailValue, { color: '#000000' }]}>{acceptedCenter.distance}</Text>
            </View>
          </View>
        </View>

        {/* Next Step Instructions removed as requested */}
      </View>

      {/* Proceed to Payment Button */}
      <View style={[styles.bottomContainer,{ backgroundColor: theme.surface, borderTopColor: BLUE_COLOR + '30' }]}>
        <TouchableOpacity style={[styles.paymentButton, { backgroundColor: BLUE_COLOR }]} onPress={() => onProceedToPayment?.(instantBookingData)}>
          <Text style={[styles.paymentButtonText, { color: '#FFFFFF' }]}>Proceed to Payment</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 14,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZES.HEADING_LARGE,
    fontWeight: '600',
    marginBottom: 6,
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  confirmationSection: {
    alignItems: 'center',
    marginVertical: 32,
    paddingTop: 20,
  },
  confirmationIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: BLUE_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmationTitle: {
    fontSize: FONT_SIZES.HEADING_LARGE,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  confirmationSubtitle: {
    fontSize: FONT_SIZES.BODY_LARGE,
    textAlign: 'center',
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  detailsSection: {
    marginBottom: 32,
  },
  detailsTitle: {
    fontSize: FONT_SIZES.HEADING_LARGE,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    letterSpacing: -0.4,
  },
  detailsCard: {
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  detailRowWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailLabel: {
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
    flex: 1,
  },
  detailValue: {
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontWeight: '500',
    fontFamily: FONTS.INTER_MEDIUM,
    flex: 1.5,
    textAlign: 'right',
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
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 24,
  },
  paymentButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: BLUE_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  paymentButtonText: {
    fontSize: FONT_SIZES.BUTTON_LARGE,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
    letterSpacing: 0.5,
  },
});

export default BookingConfirmedScreen;
