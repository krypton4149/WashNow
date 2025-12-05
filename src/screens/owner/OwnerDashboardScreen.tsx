import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authService from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';

const BLUE_COLOR = '#0358a8';
const YELLOW_COLOR = '#f4c901';

interface OwnerDashboardScreenProps {
  onBookWash?: () => void;
  onViewAll?: () => void;
  onActivityPress?: (activity: any) => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onLogout?: () => void;
  onBookingRequestPress?: () => void;
  businessName?: string;
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
  customerName?: string;
}

interface Visitor {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
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
  visitor?: Visitor;
}

interface BookingStatusTotals {
  cancelled?: number;
  completed?: number;
  Pending?: number;
}

const OwnerDashboardScreen: React.FC<OwnerDashboardScreenProps> = ({
  onBookWash,
  onViewAll,
  onActivityPress,
  onNotificationPress,
  onProfilePress,
  onLogout,
  onBookingRequestPress,
  businessName,
}) => {
  const { colors } = useTheme();
  
  // State for bookings data
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingStatusTotals, setBookingStatusTotals] = useState<BookingStatusTotals | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);

  // Get user's first name for welcome message
  useEffect(() => {
    const loadUserData = async () => {
      const user = await authService.getUser();
      setUserData(user);
    };
    loadUserData();
  }, []);

  const fullName = userData?.fullName || 
                   userData?.name || 
                   userData?.ownerName || 
                   businessName || 
                   'Owner';

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
        // Format as DD/MM/YYYY
        const day = String(createdDate.getDate()).padStart(2, '0');
        const month = String(createdDate.getMonth() + 1).padStart(2, '0');
        const year = createdDate.getFullYear();
        return `${day}/${month}/${year}`;
      }
    } catch (error) {
      // Fallback: try to format bookingDate directly
      try {
        const bookingDateObj = new Date(bookingDate);
        if (!isNaN(bookingDateObj.getTime())) {
          const day = String(bookingDateObj.getDate()).padStart(2, '0');
          const month = String(bookingDateObj.getMonth() + 1).padStart(2, '0');
          const year = bookingDateObj.getFullYear();
          return `${day}/${month}/${year}`;
        }
      } catch (e) {
        // Ignore
      }
      return 'Recently';
    }
  };

  const mapBookingStatus = (apiStatus: string): 'In Progress' | 'Completed' | 'Canceled' => {
    const status = apiStatus.toLowerCase();
    if (status.includes('completed') || status.includes('done')) {
      return 'Completed';
    } else if (status.includes('canceled') || status.includes('cancelled')) {
      return 'Canceled';
    } else if (status.includes('pending')) {
      return 'In Progress';
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
      
      console.log('Loading owner bookings for dashboard...');
      const result = await authService.getOwnerBookings();
      console.log('Owner dashboard booking list result:', JSON.stringify(result, null, 2));
      
      if (result.success && result.bookings) {
        console.log('Owner bookings loaded successfully for dashboard:', result.bookings.length);
        setBookings(Array.isArray(result.bookings) ? result.bookings : []);
        
        // Set booking status totals if available
        if (result.bookingStatusTotals) {
          setBookingStatusTotals(result.bookingStatusTotals);
        }
      } else {
        console.log('Failed to load owner bookings for dashboard:', result.error);
        setError(result.error || 'Failed to load bookings');
        setBookings([]);
        setBookingStatusTotals(null);
      }
    } catch (error) {
      console.error('Error loading owner bookings for dashboard:', error);
      setError('Failed to load bookings');
      setBookings([]);
      setBookingStatusTotals(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats from bookings - use booking_status_totals if available, otherwise calculate from bookings
  const totalBookings = bookings.length;
  const currentRequests = bookingStatusTotals?.Pending || 
    bookings.filter(booking => 
      booking.status.toLowerCase().includes('pending') || 
      booking.status.toLowerCase().includes('confirmed') ||
      booking.status.toLowerCase().includes('in progress')
    ).length;
  const completedBookings = bookingStatusTotals?.completed || 
    bookings.filter(booking => 
      booking.status.toLowerCase().includes('completed')
    ).length;
  const cancelledBookings = bookingStatusTotals?.cancelled || 
    bookings.filter(booking => 
      booking.status.toLowerCase().includes('canceled') || 
      booking.status.toLowerCase().includes('cancelled')
    ).length;

  // Convert bookings to activities for recent activity section
  const recentActivities: Activity[] = bookings
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)
    .map(booking => ({
      id: booking.booking_id,
      title: booking.visitor?.name || `Customer ${booking.visitor_id}`,
      serviceType: booking.service_type,
      time: formatBookingTime(booking.booking_date, booking.created_at),
      status: mapBookingStatus(booking.status),
      bookingDate: booking.booking_date,
      bookingTime: booking.booking_time,
      vehicleNo: booking.vehicle_no,
      bookingCode: booking.booking_id,
      paymentMethod: booking.notes || undefined,
      customerName: booking.visitor?.name,
    }));

  const renderActivityItem = (activity: Activity) => (
    <TouchableOpacity
      key={activity.id}
      style={[styles.activityItem, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => onActivityPress?.(activity)}
    >
      <View style={styles.activityContent}>
        <View style={styles.activityInfo}>
          {/* Title and Status Tag on Same Row */}
          <View style={styles.titleRow}>
            <Text style={[styles.activityTitle, { color: colors.text }]}>{activity.title}</Text>
            {activity.status === 'In Progress' && (
              <View style={styles.statusTagInProgress}>
                <Text style={styles.statusTextInProgress}>{activity.status}</Text>
                <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
              </View>
            )}
            {activity.status === 'Completed' && (
              <View style={styles.statusTagCompleted}>
                <Text style={styles.statusTextCompleted}>{activity.status}</Text>
              </View>
            )}
            {activity.status === 'Canceled' && (
              <View style={styles.statusTagCanceled}>
                <Text style={styles.statusTextCanceled}>{activity.status}</Text>
              </View>
            )}
          </View>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={16} color={colors.textSecondary} style={styles.timeIcon} />
            <Text style={[styles.activityTimeText, { color: colors.textSecondary }]}>{activity.time}</Text>
          </View>
          {activity.vehicleNo ? (
            <View style={styles.recentRow}>
              <Ionicons name="car-outline" size={16} color={colors.textSecondary} style={styles.recentIcon} />
              <Text style={[styles.recentText, { color: colors.textSecondary }]}>Vehicle: {activity.vehicleNo}</Text>
            </View>
          ) : null}
          {activity.bookingCode ? (
            <View style={styles.recentRow}>
              <Ionicons name="receipt-outline" size={16} color={colors.textSecondary} style={styles.recentIcon} />
              <Text style={[styles.recentBookingId, { color: colors.text }]}>{activity.bookingCode}</Text>
            </View>
          ) : null}
          <View style={[styles.activityDivider, { backgroundColor: colors.border }]} />
          {activity.status === 'In Progress' && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancel(activity.id)}
            >
              <Text style={styles.cancelButtonText}>Cancel Booking</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleCancel = async (bookingId: string) => {
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
              console.log('Cancelling owner booking from dashboard:', bookingId);
              const result = await authService.cancelOwnerBooking(bookingId);
              
              if (result.success) {
                Alert.alert('Success', result.message || 'Booking cancelled successfully');
                // Reload bookings to show updated status
                await loadBookings();
              } else {
                Alert.alert('Error', result.error || 'Failed to cancel booking. Please try again.');
              }
            } catch (error) {
              console.error('Cancel owner booking error:', error);
              Alert.alert('Error', 'Failed to cancel booking. Please try again.');
            }
          }
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Logging out owner...');
              const result = await authService.logoutOwner();
              
              if (result.success) {
                // Call the onLogout callback to handle navigation
                onLogout?.();
              } else {
                Alert.alert('Error', result.error || 'Failed to logout. Please try again.');
              }
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
              // Even on error, try to call onLogout to clear the session
              onLogout?.();
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent={true} backgroundColor="transparent" barStyle="light-content" />

      {/* BLUE HEADER WITH CURVE */}
      <View style={styles.headerSection}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeText}>Welcome to Kwik Wash,</Text>
            <Text style={styles.userNameText}>{fullName}</Text>
          </View>
          <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={25} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Metric Cards */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Ionicons name="calendar-outline" color="#fff" size={22} />
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginVertical: 4 }} />
            ) : (
              <Text style={styles.metricValue}>{totalBookings}</Text>
            )}
            <Text style={styles.metricLabel}>Total</Text>
          </View>

          <View style={styles.metricCard}>
            <Ionicons name="time-outline" color={YELLOW_COLOR} size={22} />
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginVertical: 4 }} />
            ) : (
              <Text style={styles.metricValue}>{currentRequests}</Text>
            )}
            <Text style={styles.metricLabel}>Pending</Text>
          </View>

          <View style={styles.metricCard}>
            <Ionicons name="checkmark-circle-outline" color="#fff" size={22} />
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginVertical: 4 }} />
            ) : (
              <Text style={styles.metricValue}>{completedBookings}</Text>
            )}
            <Text style={styles.metricLabel}>Done</Text>
          </View>
        </View>
      </View>

      {/* WHITE CONTENT */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Yellow Banner */}
        <TouchableOpacity
          style={styles.banner}
          onPress={onBookingRequestPress || onBookWash}
          activeOpacity={0.8}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>View Booking Requests</Text>
            <Text style={styles.bannerSubtitle}>
              Manage and respond to customer bookings
            </Text>
          </View>
          <Ionicons name="calendar-outline" size={24} color="#1A1A1A" />
        </TouchableOpacity>

        {/* Recent Activity Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity style={styles.seeAllBtn} onPress={onViewAll}>
            <Text style={styles.seeAllText}>See all</Text>
            <Ionicons name="chevron-forward" size={16} color={BLUE_COLOR} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BLUE_COLOR} />
            <Text style={styles.loadingText}>Loading recent activity...</Text>
          </View>
        ) : recentActivities.length > 0 ? (
          recentActivities.map(renderActivityItem)
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recent activity</Text>
            <Text style={styles.emptySubtext}>Customer bookings will appear here</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BLUE_COLOR,
  },
  headerSection: {
    backgroundColor: BLUE_COLOR,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 10,
    paddingBottom: 25,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  userNameText: {
    color: '#fff',
    fontSize: Platform.OS === 'ios' ? 24 : 28,
    fontWeight: '700',
    fontFamily: 'Montserrat-Bold',
  },
  iconButton: {
    padding: 6,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginVertical: 4,
  },
  metricLabel: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
  },
  banner: {
    marginHorizontal: 20,
    backgroundColor: YELLOW_COLOR,
    padding: 16,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#1A1A1A',
    marginBottom: 3,
  },
  bannerSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#1A1A1A',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Montserrat-SemiBold',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: BLUE_COLOR,
    marginRight: 4,
  },
  activityItem: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginBottom: 8,
  },
  activityContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  activityInfo: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityTitle: { 
    fontSize: 16, 
    fontWeight: '400', 
    flex: 1,
    fontFamily: 'Inter-Regular',
    color: '#1A1A1A',
  },
  activityService: { 
    fontSize: 14, 
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
    color: '#666666',
  },
  timeRow: { flexDirection: 'row', alignItems: 'center' },
  timeIcon: { marginRight: 6 },
  activityTimeText: { 
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#666666',
  },
  recentRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  recentIcon: { marginRight: 6 },
  recentText: { 
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#666666',
  },
  recentBookingId: { 
    fontSize: 16, 
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#1A1A1A',
  },
  activityDivider: { height: 1, marginTop: 12 },
  statusTagInProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BLUE_COLOR,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusTextInProgress: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter-Medium',
  },
  statusTagCompleted: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusTextCompleted: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter-Medium',
  },
  statusTagCanceled: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusTextCanceled: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter-Medium',
  },
  cancelButton: {
    marginTop: 10,
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
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginTop: 12,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#666',
    textAlign: 'center',
  },
});

export default OwnerDashboardScreen;

