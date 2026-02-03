import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale, platformEdges } from '../../utils/responsive';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { FONTS, FONT_SIZES, TEXT_STYLES } from '../../utils/fonts';
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
      address?: string;
      selectedService?: { name?: string; service_name?: string; id?: string | number };
    };
    date?: string;
    time?: string;
    bookingId?: string;
    serviceName?: string;
    vehicleNo?: string;
  };
  totalAmount?: number | string;
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

  // Fetch booking details: cache first for fast display, then refresh in background
  useEffect(() => {
    const findBooking = (bookings: any[]) => {
      if (!bookings || !bookingId) return null;
      const idStr = String(bookingId);
      return bookings.find(
        (b: any) =>
          String(b.booking_id || '') === idStr ||
          b.booking_no === bookingId ||
          b.bookingno === bookingId ||
          b.id?.toString() === idStr
      ) || null;
    };

    const fetchBookingDetails = async () => {
      if (!bookingId) return;
      try {
        // 1) Cache first for fast response
        const cached = await authService.getBookingList(false);
        let hadCacheHit = false;
        if (cached.success && cached.bookings?.length) {
          const found = findBooking(cached.bookings);
          if (found) {
            setBookingDetails(found);
            hadCacheHit = true;
          }
        }
        if (!hadCacheHit) setLoadingBooking(true);
        // 2) Refresh in background for latest (price, status, vehicle)
        const result = await authService.getBookingList(true);
        if (result.success && result.bookings?.length) {
          const found = findBooking(result.bookings);
          if (found) setBookingDetails(found);
        }
      } catch (error) {
        console.error('Error fetching booking details:', error);
      } finally {
        setLoadingBooking(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  // Get price from API response or fallback to prop (support string from API)
  const apiPrice = bookingDetails?.price != null
    ? parseFloat(String(bookingDetails.price))
    : null;
  const parsedTotal = totalAmount != null ? (typeof totalAmount === 'number' ? totalAmount : parseFloat(String(totalAmount))) : null;
  const finalAmount = (apiPrice != null && !isNaN(apiPrice)) ? apiPrice : (parsedTotal != null && !isNaN(parsedTotal) ? parsedTotal : null);

  // Format the total amount - show actual amount paid (API may return £ or numeric)
  const formattedAmount = finalAmount != null && !isNaN(finalAmount)
    ? (bookingDetails?.price != null ? `£${Number(finalAmount).toFixed(2)}` : `$${Number(finalAmount).toFixed(2)}`)
    : '$0.00';
  
  // On confirmation screen, show "Confirmed" for payment status (booking is confirmed)
  const paymentStatusDisplay = 'Confirmed';
  const paymentStatusColor = '#059669';

  // Format time as full slot with AM/PM e.g. "9:30-10:00 AM" (default 30 min slot)
  const to12h = (h: number, m: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
  };
  const formatTimeSlotForDisplay = (timeStr: string, slotMinutes: number = 30): string => {
    if (!timeStr || timeStr === 'Now') return 'Now';
    const match = timeStr.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (match) {
      let hours = parseInt(match[1], 10);
      let minutes = parseInt(match[2], 10);
      const start12 = to12h(hours, minutes);
      minutes += slotMinutes;
      if (minutes >= 60) {
        minutes -= 60;
        hours += 1;
      }
      if (hours >= 24) hours -= 24;
      const end12 = to12h(hours, minutes);
      return `${start12}-${end12}`;
    }
    const amPmMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (amPmMatch) {
      let hours = parseInt(amPmMatch[1], 10);
      const minutes = parseInt(amPmMatch[2], 10);
      const isPm = (amPmMatch[3] || '').toUpperCase() === 'PM';
      if (isPm && hours !== 12) hours += 12;
      if (!isPm && hours === 12) hours = 0;
      let endM = minutes + slotMinutes;
      let endH = hours;
      if (endM >= 60) {
        endM -= 60;
        endH += 1;
      }
      if (endH >= 24) endH -= 24;
      return `${to12h(hours, minutes)}-${to12h(endH, endM)}`;
    }
    return timeStr;
  };

  const displayTime = bookingDetails?.booking_time
    ? formatTimeSlotForDisplay(bookingDetails.booking_time)
    : (bookingData.time ? formatTimeSlotForDisplay(bookingData.time) : 'Now');

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
          <Text style={styles.confirmationSubtitle}>Your car wash has been successfully booked</Text>

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
                   bookingDetails?.service?.service_name ||
                   bookingDetails?.service_name ||
                   bookingData.center?.selectedService?.name ||
                   bookingData.center?.selectedService?.service_name ||
                   bookingData.serviceName ||
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
                  {(() => {
                    const vNo = bookingDetails?.vehicle_no || bookingDetails?.vehicle_number || bookingData.vehicleNo;
                    const carModel = bookingDetails?.carmodel || bookingDetails?.car_model;
                    if (vNo && carModel) return `${vNo} (${carModel})`;
                    if (vNo) return vNo;
                    if (carModel) return carModel;
                    return 'N/A';
                  })()}
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
                {loadingBooking ? 'Loading...' : paymentStatusDisplay}
              </Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Amount Paid</Text>
              <Text style={[styles.paymentAmount, { color: '#10B981' }]}>
                {loadingBooking ? 'Loading...' : formattedAmount}
              </Text>
            </View>
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
    ...TEXT_STYLES.screenTitle,
    color: BLUE_COLOR,
    marginBottom: moderateScale(4),
    letterSpacing: -0.3,
  },
  confirmationSubtitle: {
    ...TEXT_STYLES.bodyPrimary,
    color: '#666666',
    textAlign: 'center',
    marginBottom: moderateScale(20),
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
    ...TEXT_STYLES.cardTitleSemiBold,
    backgroundColor: '#E5E7EB',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
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
    ...TEXT_STYLES.label,
    color: '#666666',
    marginBottom: moderateScale(4),
  },
  bookingValue: {
    ...TEXT_STYLES.cardTitle,
    color: '#000',
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
    ...TEXT_STYLES.caption,
    color: '#FFFFFF',
  },
  paymentSummary: {
    backgroundColor: '#FFFFFF',
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
    ...TEXT_STYLES.label,
    color: '#666666',
  },
  paymentStatus: {
    ...TEXT_STYLES.bodyPrimary,
    color: '#666666',
  },
  paymentAmount: {
    ...TEXT_STYLES.sectionHeadingMedium,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
    color: '#000',
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
    ...TEXT_STYLES.buttonProduction,
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
    ...TEXT_STYLES.buttonProduction,
  },
});

export default ScheduleBookingConfirmedScreen;






