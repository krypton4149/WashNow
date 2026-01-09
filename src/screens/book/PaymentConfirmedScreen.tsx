import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale, platformEdges } from '../../utils/responsive';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { FONTS, FONT_SIZES } from '../../utils/fonts';
import authService from '../../services/authService';

const BLUE_COLOR = '#0358a8';

interface Props {
  onBack?: () => void;
  onViewBookingStatus?: () => void;
  onBackToHome?: () => void;
  acceptedCenter?: any;
  bookingId?: string;
  bookingData?: {
    date?: string;
    time?: string;
  };
  totalAmount?: number;
  paymentStatus?: 'Pending' | 'Paid';
}

const PaymentConfirmedScreen: React.FC<Props> = ({ 
  onBack, 
  onViewBookingStatus,
  onBackToHome,
  bookingId,
  bookingData,
  totalAmount,
  paymentStatus = 'Pending',
  acceptedCenter = {
    id: '1',
    name: 'Premium Auto Wash',
    rating: 4.8,
    distance: '0.5 mi',
    address: 'Downtown, New York - 123 Main Street',
  }
}) => {
  // Derive booking date: use bookingData date if available (scheduled booking), otherwise use current date (instant booking)
  const bookingDate = bookingData?.date ? new Date(bookingData.date) : new Date();
  const today = new Date();
  today.setHours(0,0,0,0);
  const booked = new Date(bookingDate);
  booked.setHours(0,0,0,0);
  const diffDays = Math.round((booked.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const chipLabel = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Next Day' : '';
  
  // Format date display - use bookingData date format or default
  const displayDate = bookingDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  
  // Display time: use bookingData time if available (scheduled), otherwise format current time (instant)
  const formatTimeForDisplay = (timeStr: string): string => {
    // If time is in 24-hour format (HH:MM), convert to 12-hour format (HH:MM AM/PM)
    if (timeStr.match(/^\d{2}:\d{2}$/)) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    }
    // If already in AM/PM format or "Now", return as is
    return timeStr || 'Now';
  };
  
  const displayTime = bookingData?.time ? formatTimeForDisplay(bookingData.time) : 'Now';
  const { colors } = useTheme();

  // State for booking details from API
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [loadingBooking, setLoadingBooking] = useState(false);

  // Fetch booking details from API using booking_id
  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingId) return;
      
      setLoadingBooking(true);
      try {
        const result = await authService.getBookingList(true); // Force refresh to get latest data
        if (result.success && result.bookings) {
          // Find booking by booking_id
          const foundBooking = result.bookings.find(
            (b: any) => b.booking_id === bookingId || b.id?.toString() === bookingId
          );
          if (foundBooking) {
            setBookingDetails(foundBooking);
          }
        }
      } catch (error) {
        console.error('Error fetching booking details:', error);
      } finally {
        setLoadingBooking(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  // Get price from API response or fallback to prop
  const apiPrice = bookingDetails?.price ? parseFloat(bookingDetails.price) : null;
  const finalAmount = apiPrice || totalAmount;
  
  // Format the total amount - show actual amount paid
  const formattedAmount = (typeof finalAmount === 'number' && !isNaN(finalAmount)) 
    ? `$${finalAmount.toFixed(2)}` 
    : '$0.00';
  
  // Get payment status from API or use prop
  const apiPaymentStatus = bookingDetails?.payment_status;
  const finalPaymentStatus = apiPaymentStatus 
    ? (apiPaymentStatus.toLowerCase() === 'paid' ? 'Paid' : 'Pending')
    : paymentStatus;
  
  // Determine payment status color
  const paymentStatusColor = finalPaymentStatus === 'Paid' ? '#059669' : '#F59E0B';

  return (
    <SafeAreaView style={styles.container} edges={platformEdges as any}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Confirmation Icon */}
          <View style={[styles.confirmationIcon, { backgroundColor: BLUE_COLOR }]}>
            <Ionicons name="checkmark" size={48} color="#FFFFFF" />
          </View>
          
          <Text style={styles.confirmationTitle}>Booking Confirmed!</Text>
          <Text style={styles.confirmationSubtitle}>Your car wash has been scheduled</Text>

          {/* Booking Details Card */}
          <View style={styles.bookingCard}>
          <View style={styles.bookingHeader}>
            <Text style={styles.bookingId}>Booking ID: #{bookingId || 'N/A'}</Text>
          </View>
          
          <View style={styles.bookingDetails}>
            {/* Location */}
            <View style={styles.bookingRow}>
              <View style={styles.bookingIcon}>
                <Ionicons name="location" size={16} color={BLUE_COLOR} />
              </View>
              <View style={styles.bookingContent}>
                <Text style={styles.bookingLabel}>Location</Text>
                <Text style={styles.bookingValue}>{acceptedCenter.name}</Text>
              </View>
            </View>

            {/* Date */}
            <View style={styles.bookingRow}>
              <View style={styles.bookingIcon}>
                <Ionicons name="calendar" size={16} color={BLUE_COLOR} />
              </View>
              <View style={styles.bookingContent}>
                <Text style={styles.bookingLabel}>Date</Text>
                <View style={styles.dateRow}>
                  <Text style={styles.bookingValue}>{displayDate}</Text>
                  {!!chipLabel && (
                    <View style={styles.previewTag}>
                      <Text style={styles.previewText}>{chipLabel}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Time */}
            <View style={styles.bookingRow}>
              <View style={styles.bookingIcon}>
                <Ionicons name="time" size={16} color={BLUE_COLOR} />
              </View>
              <View style={styles.bookingContent}>
                <Text style={styles.bookingLabel}>Time</Text>
                <Text style={styles.bookingValue}>{displayTime}</Text>
              </View>
            </View>
          </View>

          {/* Payment Summary */}
          <View style={styles.paymentSummary}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Payment Status</Text>
              <Text style={[styles.paymentStatus, { color: paymentStatusColor }]}>
                {loadingBooking ? 'Loading...' : finalPaymentStatus}
              </Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Total Amount</Text>
              <Text style={styles.paymentAmount}>
                {loadingBooking ? 'Loading...' : formattedAmount}
              </Text>
            </View>
          </View>
        </View>
      </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.viewStatusButton, { backgroundColor: BLUE_COLOR }]}
          onPress={() => {
            try {
              const destination = encodeURIComponent(acceptedCenter?.address || acceptedCenter?.name || 'Car Wash Center');
              const appleUrl = `http://maps.apple.com/?daddr=${destination}&dirflg=d`;
              const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
              const schemeUrl = Platform.select({
                ios: appleUrl,
                android: googleUrl,
                default: googleUrl,
              });
              Linking.openURL(schemeUrl!);
            } catch (e) {
              onViewBookingStatus?.();
            }
          }}
        >
          <Text style={[styles.viewStatusButtonText, { color: '#FFFFFF' }]}>Get Directions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.backToHomeButton, { borderColor: BLUE_COLOR }]} onPress={onBackToHome}>
          <Text style={[styles.backToHomeButtonText, { color: BLUE_COLOR }]}>Back to Home</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: moderateScale(20),
  },
  content: {
    flex: 1,
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(60),
    alignItems: 'center',
  },
  confirmationIcon: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(24),
  },
  confirmationTitle: {
    fontSize: FONT_SIZES.APP_TITLE_SMALL,
    fontWeight: '700',
    color: '#000',
    marginBottom: moderateScale(8),
    fontFamily: FONTS.MONTserrat_BOLD,
    letterSpacing: -0.5,
  },
  confirmationSubtitle: {
    fontSize: FONT_SIZES.BODY_LARGE,
    color: '#666666',
    textAlign: 'center',
    marginBottom: moderateScale(40),
    fontFamily: FONTS.INTER_REGULAR,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: moderateScale(20),
    width: '100%',
    borderWidth: 1,
    borderColor: BLUE_COLOR + '30',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    alignItems: 'flex-end',
    marginBottom: moderateScale(20),
  },
  bookingId: {
    fontSize: FONT_SIZES.CAPTION_SMALL,
    color: '#000000',
    fontWeight: '700',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
    fontFamily: FONTS.INTER_BOLD,
  },
  bookingDetails: {
    marginBottom: moderateScale(20),
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: moderateScale(16),
  },
  bookingIcon: {
    width: moderateScale(24),
    alignItems: 'center',
    marginTop: 2,
  },
  bookingContent: {
    flex: 1,
    marginLeft: moderateScale(12),
  },
  bookingLabel: {
    fontSize: FONT_SIZES.BODY_SMALL,
    color: '#666666',
    marginBottom: moderateScale(4),
    fontFamily: FONTS.INTER_MEDIUM,
  },
  bookingValue: {
    fontSize: FONT_SIZES.BODY_LARGE,
    fontWeight: '600',
    color: '#000',
    fontFamily: FONTS.INTER_SEMIBOLD,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  previewTag: {
    backgroundColor: '#374151',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(8),
  },
  previewText: {
    fontSize: moderateScale(10),
    color: '#FFFFFF',
    fontWeight: '500',
  },
  paymentSummary: {
    backgroundColor: '#F9FAFB',
    padding: moderateScale(16),
    borderRadius: moderateScale(8),
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  paymentLabel: {
    fontSize: FONT_SIZES.BODY_SMALL,
    color: '#666666',
    fontFamily: FONTS.INTER_MEDIUM,
  },
  paymentStatus: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontWeight: '500',
    fontFamily: FONTS.INTER_MEDIUM,
  },
  paymentAmount: {
    fontSize: FONT_SIZES.NUMBER_SMALL,
    fontWeight: '700',
    color: '#000',
    fontFamily: FONTS.INTER_BOLD,
  },
  bottomContainer: {
    padding: moderateScale(16),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: BLUE_COLOR + '30',
  },
  viewStatusButton: {
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(16),
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  viewStatusButtonText: {
    fontSize: FONT_SIZES.BUTTON_MEDIUM,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
    letterSpacing: 0.5,
  },
  backToHomeButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(16),
    alignItems: 'center',
  },
  backToHomeButtonText: {
    fontSize: FONT_SIZES.BUTTON_MEDIUM,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
  },
});

export default PaymentConfirmedScreen;
