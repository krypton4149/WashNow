import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authService from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';
import { platformEdges } from '../../utils/responsive';

interface Booking {
  id: number;
  booking_id: string;
  visitor_id: number;
  service_centre_id: number;
  service_type: string;
  vehicle_no: string;
  booking_date: string;
  booking_time: string;
  notes: string;
  status: string;
  cancel_by: string | null;
  tenant_id: number;
  created_at: string;
  updated_at: string;
}

interface Props {
  onBack?: () => void;
}

const BookingHistoryScreen: React.FC<Props> = ({ onBack }) => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'Ongoing' | 'Completed' | 'Canceled'>('Ongoing');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load bookings from API
  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Loading bookings...');
      const result = await authService.getBookingList();
      console.log('Booking list result:', JSON.stringify(result, null, 2));
      
      if (result.success && result.bookings) {
        console.log('Bookings loaded successfully:', result.bookings.length);
        console.log('First booking in result:', result.bookings[0]);
        setBookings(Array.isArray(result.bookings) ? result.bookings : []);
      } else {
        console.log('Failed to load bookings:', result.error);
        setError(result.error || 'Failed to load bookings');
        setBookings([]);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      setError('Failed to load bookings');
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate duration (simple estimation)
  const getDuration = (bookingDate: string, bookingTime: string): string => {
    try {
      const bookingDateTime = new Date(`${bookingDate}T${bookingTime}`);
      const now = new Date();
      const diffMs = now.getTime() - bookingDateTime.getTime();
      const diffMins = Math.max(0, Math.floor(diffMs / (1000 * 60)));
      
      if (diffMins < 60) return `${diffMins} mins`;
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    } catch (error) {
      return '45 mins';
    }
  };

  // Helper function to get display values from booking data
  const getBookingDisplayData = (booking: Booking) => {
    console.log('Processing booking:', JSON.stringify(booking, null, 2));
    
    const displayData = {
      id: booking.booking_id || booking.id.toString(),
      name: `Service Center ${booking.service_centre_id}`, // We'll need to get center name from another API
      type: booking.service_type || 'Car Wash',
      date: formatDate(booking.booking_date),
      time: formatTime(booking.booking_time),
      dateTime: `${formatDate(booking.booking_date)} • ${formatTime(booking.booking_time)}`,
      status: mapBookingStatus(booking.status),
      total: '$25.00', // Default amount since it's not in the API response
      vehicle_no: booking.vehicle_no,
      notes: booking.notes,
      address: `Service Center ${booking.service_centre_id} Location`, // Default address
      duration: getDuration(booking.booking_date, booking.booking_time),
    };
    
    console.log('Display data:', JSON.stringify(displayData, null, 2));
    return displayData;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown Date';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      return 'Unknown Date';
    }
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    if (!timeString) return 'Unknown Time';
    
    try {
      // Handle time format like "10:00:00"
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (error) {
      return 'Unknown Time';
    }
  };

  // Map API status to display status
  const mapBookingStatus = (apiStatus: string): 'In Progress' | 'Completed' | 'Canceled' => {
    console.log('Mapping status:', apiStatus);
    const status = apiStatus.toLowerCase();
    
    if (status.includes('pending') || status.includes('confirmed') || status.includes('ongoing')) {
      console.log('Status mapped to: In Progress');
      return 'In Progress';
    } else if (status.includes('completed') || status.includes('done')) {
      console.log('Status mapped to: Completed');
      return 'Completed';
    } else if (status.includes('canceled') || status.includes('cancelled')) {
      console.log('Status mapped to: Canceled');
      return 'Canceled';
    }
    
    console.log('Status mapped to default: In Progress');
    return 'In Progress'; // Default fallback
  };

  // Attempt to build a comparable timestamp from booking fields; fallback to created_at/updated_at
  const getBookingTimestamp = (b: Booking): number => {
    try {
      // Normalize booking_date
      let datePart = (b.booking_date || '').trim();
      let timePart = (b.booking_time || '00:00:00').trim();

      // Handle common non-ISO formats
      // If format is DD-MM-YYYY or DD/MM/YYYY, convert to YYYY-MM-DD
      const dmYMatch = datePart.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
      if (dmYMatch) {
        const d = dmYMatch[1].padStart(2, '0');
        const m = dmYMatch[2].padStart(2, '0');
        const y = dmYMatch[3];
        datePart = `${y}-${m}-${d}`;
      }

      // If time is HH:MM, add :00 seconds
      if (/^\d{1,2}:\d{2}$/.test(timePart)) {
        timePart = `${timePart}:00`;
      }

      const ts = Date.parse(`${datePart}T${timePart}`);
      if (!Number.isNaN(ts)) return ts;
    } catch (e) {
      // ignore, fallback below
    }
    const createdTs = Date.parse(b.created_at || '');
    const updatedTs = Date.parse(b.updated_at || '');
    return Math.max(isNaN(createdTs) ? 0 : createdTs, isNaN(updatedTs) ? 0 : updatedTs);
  };

  // Sort bookings by most recent first (by booking_date and booking_time)
  const allBookingDisplayData = ([...(bookings || [])]
    .sort((a, b) => getBookingTimestamp(b) - getBookingTimestamp(a)))
    .map(booking => {
      console.log('Mapping booking:', booking.id);
      return getBookingDisplayData(booking);
    });

  // Calculate counts for each tab
  const ongoingCount = allBookingDisplayData.filter(b => b.status === 'In Progress').length;
  const completedCount = allBookingDisplayData.filter(b => b.status === 'Completed').length;
  const canceledCount = allBookingDisplayData.filter(b => b.status === 'Canceled').length;

  // Filter bookings based on active tab
  const filteredBookings = allBookingDisplayData.filter(booking => {
    console.log(`Filtering booking ${booking.id}: status=${booking.status}, activeTab=${activeTab}`);
    if (activeTab === 'Ongoing') return booking.status === 'In Progress';
    if (activeTab === 'Completed') return booking.status === 'Completed';
    if (activeTab === 'Canceled') return booking.status === 'Canceled';
    return true;
  });

  console.log('Final filtered bookings:', filteredBookings.length, 'items');

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'In Progress':
        return '#111827'; // Dark for high contrast
      case 'Completed':
        return '#D1FAE5'; // Light green
      case 'Canceled':
        return '#FEE2E2'; // Light red
      default:
        return '#E5E7EB';
    }
  };

  const getStatusTextColor = (status: Booking['status']) => {
    switch (status) {
      case 'In Progress':
        return '#FFFFFF'; // White on dark bg
      case 'Completed':
        return '#059669'; // Green
      case 'Canceled':
        return '#DC2626'; // Red
      default:
        return '#4B5563';
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive', 
          onPress: async () => {
            try {
              console.log('Cancelling booking:', bookingId);
              const result = await authService.cancelBooking(bookingId);
              
              if (result.success) {
                Alert.alert('Success', result.message || 'Booking cancelled successfully');
                // Reload bookings to show updated status
                await loadBookings();
              } else {
                Alert.alert('Error', result.error || 'Failed to cancel booking. Please try again.');
              }
            } catch (error) {
              console.error('Cancel booking error:', error);
              Alert.alert('Error', 'Failed to cancel booking. Please try again.');
            }
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={platformEdges as any}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Booking History ({bookings.length})</Text>
        <TouchableOpacity onPress={loadBookings} style={styles.refreshButton} activeOpacity={0.7}>
          <Ionicons name="refresh" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.tabsContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Ongoing' && [styles.activeTab, { borderBottomColor: colors.button }]]}
          onPress={() => setActiveTab('Ongoing')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, { color: activeTab === 'Ongoing' ? colors.text : colors.textSecondary }, activeTab === 'Ongoing' && styles.activeTabText]}>
            Ongoing
          </Text>
          {activeTab === 'Ongoing' && ongoingCount > 0 && (
            <View style={[styles.tabBadge, { backgroundColor: colors.button }]}>
              <Text style={[styles.tabBadgeText, { color: colors.buttonText }]}>{ongoingCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Completed' && [styles.activeTab, { borderBottomColor: colors.button }]]}
          onPress={() => setActiveTab('Completed')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, { color: activeTab === 'Completed' ? colors.text : colors.textSecondary }, activeTab === 'Completed' && styles.activeTabText]}>
            Completed
          </Text>
          {activeTab === 'Completed' && completedCount > 0 && (
            <View style={[styles.tabBadge, { backgroundColor: colors.button }]}>
              <Text style={[styles.tabBadgeText, { color: colors.buttonText }]}>{completedCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Canceled' && [styles.activeTab, { borderBottomColor: colors.button }]]}
          onPress={() => setActiveTab('Canceled')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, { color: activeTab === 'Canceled' ? colors.text : colors.textSecondary }, activeTab === 'Canceled' && styles.activeTabText]}>
            Canceled
          </Text>
          {activeTab === 'Canceled' && canceledCount > 0 && (
            <View style={[styles.tabBadge, { backgroundColor: colors.button }]}>
              <Text style={[styles.tabBadgeText, { color: colors.buttonText }]}>{canceledCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.bookingsList} 
        contentContainerStyle={styles.bookingsListContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.text} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading your bookings...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.text }]}>Failed to load bookings</Text>
            <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>{error}</Text>
            <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.button }]} onPress={loadBookings}>
              <Text style={[styles.retryButtonText, { color: colors.buttonText }]}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredBookings.length > 0 ? (
          filteredBookings.map((booking) => (
            <View key={booking.id} style={[styles.bookingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Header Bar - Different colors for different statuses */}
              {booking.status === 'In Progress' && (
                <View style={styles.statusHeaderBar}>
                  <View style={styles.statusHeaderLeft}>
                    <Text style={styles.statusHeaderText}>In Progress</Text>
                    <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                  </View>
                </View>
              )}
              {booking.status === 'Completed' && (
                <View style={styles.statusHeaderBarCompleted}>
                  <View style={styles.statusHeaderLeft}>
                    <Text style={styles.statusHeaderTextCompleted}>Completed</Text>
                  </View>
                </View>
              )}
              {booking.status === 'Canceled' && (
                <View style={styles.statusHeaderBarCanceled}>
                  <View style={styles.statusHeaderLeft}>
                    <Text style={styles.statusHeaderTextCanceled}>Canceled </Text>
                  </View>
                </View>
              )}
              
              {/* Card Content */}
              <View style={styles.cardContent}>
                <Text style={[styles.serviceName, { color: colors.text }]}>{booking.name}</Text>
                
                {/* Location */}
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.locationText, { color: colors.textSecondary }]}>{booking.address}</Text>
                </View>
                
                {/* Date/Time in Pill - Different colors based on status */}
                <View style={[
                  styles.dateTimePill, 
                  booking.status === 'Completed' 
                    ? { backgroundColor: '#E8F5E9' }
                    : booking.status === 'In Progress'
                    ? { backgroundColor: '#E0E8F9' }
                    : booking.status === 'Canceled'
                    ? { backgroundColor: '#F3F4F6' }
                    : { backgroundColor: colors.border + '30' }
                ]}>
                  <Ionicons 
                    name="calendar-outline" 
                    size={14} 
                    color={
                      booking.status === 'Completed' 
                        ? '#4CAF50' 
                        : booking.status === 'In Progress'
                        ? '#3366FF'
                        : booking.status === 'Canceled'
                        ? '#6B7280'
                        : '#3366FF'
                    } 
                  />
                  <Text style={[styles.dateTimeText, { color: colors.text }]}>{booking.dateTime}</Text>
                </View>
                
                {/* Vehicle Number */}
                <View style={styles.infoRow}>
                  <Ionicons name="car-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    Vehicle: {booking.vehicle_no}
                  </Text>
                </View>
                
                {/* Booking ID */}
                <View style={styles.infoRow}>
                  <Ionicons name="receipt-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.infoTextBold, { color: colors.text }]}>
                    Booking ID: {booking.id}
                  </Text>
                </View>
              </View>
              
              {/* Separator */}
              <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />
              
              {/* Footer */}
              <View style={styles.cardFooter}>
                <View style={styles.totalSection}>
                  <Text style={[styles.cardTotalLabel, { color: colors.textSecondary }]}>Total Amount</Text>
                  <Text style={[styles.cardTotalPrice, { color: colors.text }]}>{booking.total}</Text>
                </View>
                {booking.status === 'In Progress' && (
                  <TouchableOpacity
                    style={styles.cancelButtonFooter}
                    onPress={() => handleCancelBooking(booking.id)}
                  >
                    <Text style={styles.cancelButtonFooterText}>Cancel Booking</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noBookingsContainer}>
            <Ionicons name="information-circle-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.noBookingsText, { color: colors.textSecondary }]}>No {activeTab.toLowerCase()} bookings</Text>
            <Text style={[styles.noBookingsSubtext, { color: colors.textSecondary }]}>Check other tabs or book a new service.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  refreshButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  activeTab: {
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: '600',
  },
  tabBadge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bookingsList: {
    flex: 1,
  },
  bookingsListContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  bookingCard: {
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusHeaderBar: {
    backgroundColor: '#3366FF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  statusHeaderBarCompleted: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  statusHeaderBarCanceled: {
    backgroundColor: '#6B7280',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  statusHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E8F9',
  },
  statusHeaderText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  statusHeaderTextCompleted: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  statusHeaderTextCanceled: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  cardContent: {
    padding: 16,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  serviceType: {
    fontSize: 14,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    flex: 1,
  },
  dateTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  dateTimeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
  },
  infoTextBold: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 12,
  },
  totalSection: {
    flex: 1,
  },
  cardTotalLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  cardTotalPrice: {
    fontSize: 20,
    fontWeight: '700',
  },
  cancelButtonFooter: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  cancelButtonFooterText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 14,
  },
  noBookingsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  noBookingsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
  },
  noBookingsSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#DC2626',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BookingHistoryScreen;
