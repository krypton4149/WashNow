import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authService from '../../services/authService';

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

  // Helper function to get display values from booking data
  const getBookingDisplayData = (booking: Booking) => {
    console.log('Processing booking:', JSON.stringify(booking, null, 2));
    
    const displayData = {
      id: booking.booking_id || booking.id.toString(),
      name: `Service Center ${booking.service_centre_id}`, // We'll need to get center name from another API
      type: booking.service_type || 'Car Wash',
      date: formatDate(booking.booking_date),
      time: formatTime(booking.booking_time),
      status: mapBookingStatus(booking.status),
      total: '$25.00', // Default amount since it's not in the API response
      vehicle_no: booking.vehicle_no,
      notes: booking.notes,
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

  const filteredBookings = (bookings || [])
    .map(booking => {
      console.log('Mapping booking:', booking.id);
      return getBookingDisplayData(booking);
    })
    .filter(booking => {
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

  const handleCancelBooking = (bookingId: string) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes, Cancel', style: 'destructive', onPress: () => {
            // Optimistically update UI; integrate real API when available
            setBookings(prev => prev.map(b =>
              (b.booking_id === bookingId || String(b.id) === bookingId)
                ? { ...b, status: 'Canceled' as any }
                : b
            ));
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Booking History ({bookings.length})</Text>
        <TouchableOpacity onPress={loadBookings} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Ongoing' && styles.activeTab]}
          onPress={() => setActiveTab('Ongoing')}
        >
          <Text style={[styles.tabText, activeTab === 'Ongoing' && styles.activeTabText]}>
            Ongoing
          </Text>
          {activeTab === 'Ongoing' && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{filteredBookings.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Completed' && styles.activeTab]}
          onPress={() => setActiveTab('Completed')}
        >
          <Text style={[styles.tabText, activeTab === 'Completed' && styles.activeTabText]}>
            Completed
          </Text>
          {activeTab === 'Completed' && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{filteredBookings.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Canceled' && styles.activeTab]}
          onPress={() => setActiveTab('Canceled')}
        >
          <Text style={[styles.tabText, activeTab === 'Canceled' && styles.activeTabText]}>
            Canceled
          </Text>
          {activeTab === 'Canceled' && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{filteredBookings.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.bookingsList} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={styles.loadingText}>Loading your bookings...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#DC2626" />
            <Text style={styles.errorText}>Failed to load bookings</Text>
            <Text style={styles.errorSubtext}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadBookings}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredBookings.length > 0 ? (
          filteredBookings.map((booking) => (
            <View key={booking.id} style={styles.bookingCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{booking.name}</Text>
                <View
                  style={[
                    styles.statusTag,
                    { backgroundColor: getStatusColor(booking.status) },
                  ]}
                >
                  <Text style={[styles.statusText, { color: getStatusTextColor(booking.status) }]}>
                    {booking.status}
                  </Text>
                </View>
              </View>
              {/* Removed service type subtitle as requested */}
              <View style={styles.cardDateTime}>
                <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                <Text style={styles.cardDateTimeText}>
                  {booking.date} at {booking.time}
                </Text>
              </View>
              <View style={styles.cardVehicle}>
                <Ionicons name="car-outline" size={16} color="#6B7280" />
                <Text style={styles.cardVehicleText}>
                  Vehicle: {booking.vehicle_no}
                </Text>
              </View>
              <View style={styles.cardBookingId}>
                <Ionicons name="receipt-outline" size={16} color="#6B7280" />
                <Text style={styles.cardBookingIdTextBold}>
                  Booking ID: {booking.id}
                </Text>
              </View>
              <View style={styles.cardDivider} />
              <View style={styles.cardFooter}>
                <Text style={styles.cardTotalLabel}>Total</Text>
                <Text style={styles.cardTotalPrice}>{booking.total}</Text>
              </View>
              {booking.status === 'In Progress' && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => handleCancelBooking(booking.id)}
                >
                  <Text style={styles.cancelButtonText}>Cancel Booking</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        ) : (
          <View style={styles.noBookingsContainer}>
            <Ionicons name="information-circle-outline" size={48} color="#CCCCCC" />
            <Text style={styles.noBookingsText}>No {activeTab.toLowerCase()} bookings</Text>
            <Text style={styles.noBookingsSubtext}>Check other tabs or book a new service.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Light gray background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    color: '#111827',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    borderBottomColor: '#111827',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#111827',
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: '#111827',
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
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  statusTag: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  cardDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardDateTimeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  cardVehicle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardVehicleText: {
    fontSize: 14,
    color: '#6B7280',
  },
  cardBookingId: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardBookingIdText: {
    fontSize: 14,
    color: '#6B7280',
  },
  cardBookingIdTextBold: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTotalLabel: {
    fontSize: 15,
    color: '#111827',
  },
  cardTotalPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  cancelButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13,
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
