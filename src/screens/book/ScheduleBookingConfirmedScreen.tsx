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
  bookingData?: {
    center?: {
      id: string;
      name: string;
      address: string;
    };
    date?: string;
    time?: string;
    bookingId?: string;
  };
  totalAmount?: number;
  paymentStatus?: 'Pending' | 'Paid';
}

const ScheduleBookingConfirmedScreen: React.FC<Props> = ({ 
  onBack, 
  onViewBookingStatus,
  onBackToHome,
  totalAmount,
  paymentStatus = 'Pending',
  bookingData = {
    center: {
      id: '1',
      name: 'Harrow Hand Car Wash',
      address: 'Northolt Road, South Harrow, HA2 6AF',
    },
    date: new Date().toISOString(),
    time: '10:00 AM',
    bookingId: 'BK6305',
  }
}) => {
  // Format date
  const bookingDate = bookingData.date ? new Date(bookingData.date) : new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const booked = new Date(bookingDate);
  booked.setHours(0, 0, 0, 0);
  const diffDays = Math.round((booked.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const chipLabel = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Next Day' : '';
  
  // Format date display
  const displayDate = bookingDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const { colors } = useTheme();

  // State for booking details from API
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [loadingBooking, setLoadingBooking] = useState(false);

  // Get booking ID from bookingData
  const bookingId = bookingData?.bookingId;

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
    : (paymentStatus === 'Paid' ? 'Paid' : 'Pending');
  
  // Determine payment status color
  const paymentStatusColor = finalPaymentStatus === 'Paid' ? '#059669' : '#F59E0B';

  // Display time: format from API or use bookingData time
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

  const displayTime = bookingDetails?.booking_time 
    ? formatTimeForDisplay(bookingDetails.booking_time)
    : bookingData.time || 'Now';

  return (
    <SafeAreaView style={styles.container} edges={platformEdges as any}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Confirmation Icon */}
          <View style={[styles.confirmationIcon, { backgroundColor: '#10B981' }]}>
            <Ionicons name="checkmark" size={Platform.select({ ios: 28, android: 24 })} color="#FFFFFF" />
          </View>
          
          <Text style={styles.confirmationTitle}>Booking Confirmed!</Text>
          <Text style={styles.confirmationSubtitle}>Your car wash has been succesfully booked</Text>

          {/* Booking Details Card */}
          <View style={styles.bookingCard}>
          <View style={styles.bookingHeader}>
            <Text style={[styles.bookingId, { color: BLUE_COLOR }]}>Booking ID: #{bookingDetails?.booking_id || bookingData.bookingId || 'N/A'}</Text>
          </View>
          
          <View style={styles.bookingDetails}>
            {/* Service Centre */}
            <View style={styles.bookingRow}>
              <View style={styles.bookingIcon}>
                <Ionicons name="business" size={16} color={BLUE_COLOR} />
              </View>
              <View style={styles.bookingContent}>
                <Text style={styles.bookingLabel}>Service Centre</Text>
                <Text style={styles.bookingValue}>
                  {bookingDetails?.service_centre?.name || 
                   bookingDetails?.service_center_name || 
                   bookingData.center?.name || 
                   'N/A'}
                </Text>
              </View>
            </View>

            {/* Service */}
            <View style={styles.bookingRow}>
              <View style={styles.bookingIcon}>
                <Ionicons name="water" size={16} color={BLUE_COLOR} />
              </View>
              <View style={styles.bookingContent}>
                <Text style={styles.bookingLabel}>Service</Text>
                <Text style={styles.bookingValue}>
                  {bookingDetails?.service_type || 
                   bookingDetails?.service?.name || 
                   bookingDetails?.service_name || 
                   'N/A'}
                </Text>
              </View>
            </View>

            {/* Vehicle Details */}
            <View style={styles.bookingRow}>
              <View style={styles.bookingIcon}>
                <Ionicons name="car" size={16} color={BLUE_COLOR} />
              </View>
              <View style={styles.bookingContent}>
                <Text style={styles.bookingLabel}>Vehicle Details</Text>
                <Text style={styles.bookingValue}>
                  {bookingDetails?.vehicle_no || 
                   bookingDetails?.vehicle_number || 
                   'N/A'}
                </Text>
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
                  <Text style={styles.bookingValue}>
                    {bookingDetails?.booking_date 
                      ? new Date(bookingDetails.booking_date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })
                      : displayDate}
                  </Text>
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
            {(bookingDetails?.price || finalAmount) && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Amount Paid</Text>
                <Text style={[styles.paymentAmount, { color: '#10B981' }]}>
                  {loadingBooking ? 'Loading...' : 
                   bookingDetails?.price 
                     ? `£${parseFloat(bookingDetails.price).toFixed(2)}`
                     : formattedAmount}
                </Text>
              </View>
            )}
            {bookingDetails?.payment_method && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Payment Method</Text>
                <Text style={styles.paymentStatus}>
                  {bookingDetails.payment_method}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={[styles.backToHomeButton, { borderColor: BLUE_COLOR, marginBottom: moderateScale(12) }]} onPress={onBackToHome}>
          <Text style={[styles.backToHomeButtonText, { color: BLUE_COLOR }]}>Go to Dashboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.viewStatusButton, { backgroundColor: BLUE_COLOR }]}
          onPress={() => {
            try {
              const destination = encodeURIComponent(bookingData.center?.address || bookingData.center?.name || 'Car Wash Center');
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
    paddingTop: moderateScale(32),
    alignItems: 'center',
  },
  confirmationIcon: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  confirmationTitle: {
    fontSize: FONT_SIZES.BODY_LARGE,
    fontWeight: '700',
    color: BLUE_COLOR,
    marginBottom: moderateScale(4),
    fontFamily: FONTS.MONTserrat_BOLD,
    letterSpacing: -0.3,
  },
  confirmationSubtitle: {
    fontSize: FONT_SIZES.BODY_SMALL,
    color: '#666666',
    textAlign: 'center',
    marginBottom: moderateScale(20),
    fontFamily: FONTS.INTER_REGULAR,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: moderateScale(16),
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
    marginBottom: moderateScale(16),
  },
  bookingId: {
    fontSize: FONT_SIZES.CAPTION_SMALL,
    fontWeight: '700',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
    fontFamily: FONTS.INTER_BOLD,
  },
  bookingDetails: {
    marginBottom: moderateScale(16),
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: moderateScale(12),
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

export default ScheduleBookingConfirmedScreen;






