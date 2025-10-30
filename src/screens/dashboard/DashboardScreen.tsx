import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { platformEdges } from '../../utils/responsive';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authService from '../../services/authService';

interface UserData {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  type: string;
  status?: string;
}

interface DashboardScreenProps {
  onBookWash?: () => void;
  onViewAll?: () => void;
  onActivityPress?: (activity: any) => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  userData?: UserData | null;
}

interface Activity {
  id: string;
  title: string;
  serviceType: string;
  time: string;
  status: 'In Progress' | 'Completed' | 'Canceled';
  bookingDate?: string;
  bookingTime?: string;
  vehicleNo?: string;
  bookingCode?: string;
  paymentMethod?: string;
}

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

const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onBookWash,
  onViewAll,
  onActivityPress,
  onNotificationPress,
  onProfilePress,
  userData,
}) => {
  // Get user's first name for welcome message
  const firstName = userData?.fullName?.split(' ')[0] || 'User';
  
  // State for bookings data
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🧩 Helper functions defined BEFORE use
  const formatBookingTime = (bookingDate: string, createdAt: string) => {
    try {
      const createdDate = new Date(createdAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        return 'Today';
      } else if (diffDays === 2) {
        return 'Yesterday';
      } else if (diffDays <= 7) {
        return `${diffDays - 1} days ago`;
      } else {
        return createdDate.toLocaleDateString();
      }
    } catch (error) {
      return 'Recently';
    }
  };

  const mapBookingStatus = (apiStatus: string): 'In Progress' | 'Completed' | 'Canceled' => {
    const status = apiStatus.toLowerCase();
    if (status.includes('completed') || status.includes('done')) {
      return 'Completed';
    } else if (status.includes('canceled') || status.includes('cancelled')) {
      return 'Canceled';
    } else {
      return 'In Progress';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress':
        return '#111827';
      case 'Completed':
        return '#10B981';
      case 'Canceled':
        return '#DC2626';
      default:
        return '#6B7280';
    }
  };

  const getStatusStyles = (status: string) => {
    // High-contrast pill for In Progress to match theme (black bg, white text)
    if (status === 'In Progress') {
      return { backgroundColor: '#111827', color: '#FFFFFF' };
    }
    if (status === 'Completed') {
      return { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981' };
    }
    if (status === 'Canceled') {
      return { backgroundColor: 'rgba(220, 38, 38, 0.15)', color: '#DC2626' };
    }
    return { backgroundColor: 'rgba(107, 114, 128, 0.15)', color: '#6B7280' };
  };

  // Load bookings data
  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Loading bookings for dashboard...');
      const result = await authService.getBookingList();
      console.log('Dashboard booking list result:', JSON.stringify(result, null, 2));
      
      if (result.success && result.bookings) {
        console.log('Bookings loaded successfully for dashboard:', result.bookings.length);
        setBookings(Array.isArray(result.bookings) ? result.bookings : []);
      } else {
        console.log('Failed to load bookings for dashboard:', result.error);
        setError(result.error || 'Failed to load bookings');
        setBookings([]);
      }
    } catch (error) {
      console.error('Error loading bookings for dashboard:', error);
      setError('Failed to load bookings');
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats from bookings
  const totalBookings = bookings.length;
  const currentRequests = bookings.filter(booking => 
    booking.status.toLowerCase().includes('pending') || 
    booking.status.toLowerCase().includes('confirmed')
  ).length;
  const completedBookings = bookings.filter(booking => 
    booking.status.toLowerCase().includes('completed')
  ).length;

  // Convert bookings to activities for recent activity section
  const recentActivities: Activity[] = bookings
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)
    .map(booking => ({
      id: booking.booking_id,
      title: `Service Center ${booking.service_centre_id}`,
      serviceType: booking.service_type,
      time: formatBookingTime(booking.booking_date, booking.created_at),
      status: mapBookingStatus(booking.status),
      bookingDate: booking.booking_date,
      bookingTime: booking.booking_time,
      vehicleNo: booking.vehicle_no,
      bookingCode: booking.booking_id,
      paymentMethod: booking.notes || undefined,
    }));

  const renderActivityItem = (activity: Activity) => (
    <TouchableOpacity
      key={activity.id}
      style={styles.activityItem}
      onPress={() => onActivityPress?.(activity)}
    >
      <View style={styles.activityContent}>
        <View style={styles.activityInfo}>
          <Text style={styles.activityTitle}>{activity.title}</Text>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={16} color="#6B7280" style={styles.timeIcon} />
            <Text style={styles.activityTimeText}>{activity.time}</Text>
          </View>
          {activity.vehicleNo ? (
            <View style={styles.recentRow}>
              <Ionicons name="car-outline" size={16} color="#6B7280" style={styles.recentIcon} />
              <Text style={styles.recentText}>Vehicle: {activity.vehicleNo}</Text>
            </View>
          ) : null}
          {activity.bookingCode ? (
            <View style={styles.recentRow}>
              <Ionicons name="receipt-outline" size={16} color="#6B7280" style={styles.recentIcon} />
              <Text style={styles.recentBookingId}>Booking ID: {activity.bookingCode}</Text>
            </View>
          ) : null}
          <View style={styles.activityDivider} />
          {activity.status === 'In Progress' && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancel(activity.id)}
            >
              <Text style={styles.cancelButtonText}>Cancel Booking</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.activityRight}>
          <View style={[styles.statusTag, { backgroundColor: getStatusStyles(activity.status).backgroundColor }]}>
            <Text style={[styles.statusText, { color: getStatusStyles(activity.status).color }]}>
              {activity.status}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" style={styles.chevron} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleCancel = (bookingId: string) => {
    // Optimistic cancel for dashboard list
    setBookings(prev => prev.map(b =>
      (b.booking_id === bookingId ? { ...b, status: 'Canceled' as any } : b)
    ));
  };

  return (
    <SafeAreaView style={styles.container} edges={platformEdges as any}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.welcomeText}>Welcome to Car Wash,</Text>
              <Text style={styles.userNameText}>{firstName}</Text>
            </View>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconWrap}>
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            </View>
            <Text style={styles.summaryNumber}>
              {isLoading ? <ActivityIndicator size="small" color="#000000" /> : totalBookings}
            </Text>
            <Text style={styles.summaryLabel}>Total Bookings</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconWrap}>
              <Ionicons name="time-outline" size={20} color="#6B7280" />
            </View>
            <Text style={styles.summaryNumber}>
              {isLoading ? <ActivityIndicator size="small" color="#000000" /> : currentRequests}
            </Text>
            <Text style={styles.summaryLabel}>Current Request</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconWrap}>
              <Ionicons name="checkmark-done-outline" size={20} color="#6B7280" />
            </View>
            <Text style={styles.summaryNumber}>
              {isLoading ? <ActivityIndicator size="small" color="#000000" /> : completedBookings}
            </Text>
            <Text style={styles.summaryLabel}>Completed</Text>
          </View>
        </View>

        {/* Book a Car Wash Button */}
        <TouchableOpacity style={styles.bookButton} onPress={onBookWash}>
          <Text style={styles.bookButtonText}>Book a car wash</Text>
        </TouchableOpacity>

        {/* Recent Activity Section */}
        <View style={styles.activitySection}>
          <View style={styles.activityHeader}>
            <Text style={styles.activitySectionTitle}>Recent Bookings</Text>
            <TouchableOpacity onPress={onViewAll} style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.activityList}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#000000" />
                <Text style={styles.loadingText}>Loading recent activity...</Text>
              </View>
            ) : recentActivities.length > 0 ? (
              recentActivities.map(renderActivityItem)
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No recent activity</Text>
                <Text style={styles.emptySubtext}>Book your first car wash to see activity here</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollView: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerIcons: { flexDirection: 'row', gap: 12 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  welcomeText: { fontSize: 16, color: '#6B7280', marginBottom: 2 },
  userNameText: { fontSize: 24, fontWeight: 'bold', color: '#000000' },
  summaryCards: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  summaryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryNumber: { fontSize: 24, fontWeight: 'bold', color: '#000000', marginVertical: 8 },
  summaryLabel: { fontSize: 12, color: '#6B7280', textAlign: 'center' },
  bookButton: {
    backgroundColor: '#000000',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  bookButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  activitySection: { paddingHorizontal: 20 },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activitySectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#000000' },
  seeAllButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  seeAllText: { fontSize: 14, color: '#000000', fontWeight: '500' },
  activityList: { gap: 12, paddingBottom: 20 },
  activityItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activityInfo: { flex: 1 },
  activityTitle: { fontSize: 16, fontWeight: '600', color: '#000000', marginBottom: 4 },
  activityService: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
  timeRow: { flexDirection: 'row', alignItems: 'center' },
  timeIcon: { marginRight: 6 },
  activityTimeText: { fontSize: 12, color: '#6B7280' },
  recentRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  recentIcon: { marginRight: 6 },
  recentText: { fontSize: 13, color: '#6B7280' },
  recentBookingId: { fontSize: 13, color: '#111827', fontWeight: '700' },
  activityDivider: { height: 1, backgroundColor: '#F3F4F6', marginTop: 12 },
  activityRight: { alignItems: 'center', flexDirection: 'row' },
  statusTag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  statusText: { fontSize: 12, fontWeight: '600' },
  chevron: { marginLeft: 10 },
  cancelButton: { marginTop: 10, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#FCA5A5', backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  cancelButtonText: { color: '#DC2626', fontWeight: '700', fontSize: 12 },
  loadingContainer: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { fontSize: 14, color: '#6B7280', marginTop: 12 },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: '#6B7280', fontWeight: '500', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
});

export default DashboardScreen;
