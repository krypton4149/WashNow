import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
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
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={Platform.select({ ios: 24, android: 22 })} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: colors.text }]}>Booking Confirmed</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Ready to proceed to payment</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Booking Confirmed */}
        <View style={styles.confirmationSection}>
          <View style={[styles.confirmationIcon, { backgroundColor: BLUE_COLOR }]}>
            <Ionicons name="checkmark" size={Platform.select({ ios: 52, android: 48 })} color="#FFFFFF" />
          </View>
          <Text style={[styles.confirmationTitle, { color: '#000000' }]}>Center Selected!</Text>
          <Text style={[styles.confirmationSubtitle, { color: '#666666' }]}>
            {acceptedCenter.name || acceptedCenter.service_center_name || 'Service Center'} is ready for your booking
          </Text>
        </View>

        {/* Car Wash Details */}
        <View style={styles.detailsSection}>
          <Text style={[styles.detailsTitle, { color: '#000000' }]}>Your Car Wash Details</Text>
          <View style={[styles.detailsCard, { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB', borderWidth: 1 }]}>
            <View style={[styles.detailRow, styles.detailRowWithBorder]}>
              <Text style={[styles.detailLabel, { color: '#666666' }]}>Center:</Text>
              <Text style={[styles.detailValue, { color: '#000000' }]}>
                {acceptedCenter.name || acceptedCenter.service_center_name || 'Service Center'}
              </Text>
            </View>
            <View style={[styles.detailRow, styles.detailRowWithBorder]}>
              <Text style={[styles.detailLabel, { color: '#666666' }]}>Date:</Text>
              <Text style={[styles.detailValue, { color: '#000000' }]}>{dateString}</Text>
            </View>
            {acceptedCenter.distance && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: '#666666' }]}>Distance:</Text>
                <Text style={[styles.detailValue, { color: '#000000' }]}>{acceptedCenter.distance}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Next Step Instructions removed as requested */}
      </ScrollView>

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
    justifyContent: 'space-between',
    paddingHorizontal: Platform.select({ ios: 20, android: 16 }),
    paddingTop: Platform.select({ ios: 10, android: 8 }),
    paddingBottom: Platform.select({ ios: 10, android: 8 }),
    borderBottomWidth: 1,
  },
  backButton: {
    width: Platform.select({ ios: 36, android: 32 }),
    height: Platform.select({ ios: 36, android: 32 }),
    borderRadius: Platform.select({ ios: 18, android: 16 }),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZES.BODY_LARGE,
    fontWeight: '500',
    marginBottom: Platform.select({ ios: 4, android: 3 }),
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZES.CAPTION_MEDIUM,
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Platform.select({ ios: 20, android: 16 }),
    paddingTop: Platform.select({ ios: 20, android: 16 }),
    paddingBottom: Platform.select({ ios: 20, android: 16 }),
  },
  confirmationSection: {
    alignItems: 'center',
    marginVertical: Platform.select({ ios: 32, android: 24 }),
    paddingTop: Platform.select({ ios: 20, android: 12 }),
  },
  confirmationIcon: {
    width: Platform.select({ ios: 100, android: 80 }),
    height: Platform.select({ ios: 100, android: 80 }),
    borderRadius: Platform.select({ ios: 50, android: 40 }),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.select({ ios: 28, android: 20 }),
    shadowColor: BLUE_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmationTitle: {
    fontSize: FONT_SIZES.BODY_LARGE,
    fontWeight: '500',
    marginBottom: Platform.select({ ios: 12, android: 10 }),
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  confirmationSubtitle: {
    fontSize: FONT_SIZES.BODY_MEDIUM,
    textAlign: 'center',
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
    lineHeight: Platform.select({ ios: 22, android: 20 }),
    paddingHorizontal: Platform.select({ ios: 20, android: 16 }),
  },
  detailsSection: {
    marginTop: Platform.select({ ios: 24, android: 20 }),
    marginBottom: Platform.select({ ios: 32, android: 24 }),
  },
  detailsTitle: {
    fontSize: FONT_SIZES.BODY_LARGE,
    fontWeight: '500',
    marginBottom: Platform.select({ ios: 20, android: 16 }),
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    letterSpacing: -0.2,
  },
  detailsCard: {
    backgroundColor: '#F9FAFB',
    padding: Platform.select({ ios: 20, android: 16 }),
    borderRadius: Platform.select({ ios: 16, android: 12 }),
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
    paddingVertical: Platform.select({ ios: 14, android: 12 }),
  },
  detailRowWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailLabel: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
    flex: 1,
  },
  detailValue: {
    fontSize: FONT_SIZES.BODY_SMALL,
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
    padding: Platform.select({ ios: 20, android: 16 }),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: Platform.select({ ios: 24, android: 20 }),
  },
  paymentButton: {
    borderRadius: Platform.select({ ios: 32, android: 28 }),
    paddingVertical: Platform.select({ ios: 18, android: 14 }),
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
