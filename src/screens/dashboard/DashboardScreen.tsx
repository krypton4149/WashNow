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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { platformEdges } from '../../utils/responsive';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authService from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';

const BLUE_COLOR = '#0358a8';
const YELLOW_COLOR = '#f4c901';

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
  onLogout?: () => void;
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
  onLogout,
  userData,
}) => {
  // Get user's first name for welcome message
  const firstName = userData?.fullName?.split(' ')[0] || 'User';
  const { colors } = useTheme();
  
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
              console.log('Cancelling booking from dashboard:', bookingId);
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>Welcome to Car Wash,</Text>
              <Text style={[styles.userNameText, { color: colors.text }]}>{firstName}</Text>
            </View>
            <TouchableOpacity style={styles.iconButton} onPress={onLogout}>
              <Ionicons name="log-out-outline" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryCards}>
          <View style={[styles.summaryCard, styles.summaryCardGradient]}>
            <View style={styles.gradientBackground} />
            <View style={styles.gradientOverlay} />
            <View style={styles.summaryCardContent}>
              <View style={styles.summaryIconWrapBlue}>
                <Ionicons name="calendar-outline" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.summaryNumberWhite}>
                {isLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : totalBookings}
              </Text>
              <Text style={styles.summaryLabelWhite}>Total Bookings</Text>
            </View>
          </View>
          
          <View style={[styles.summaryCard, styles.summaryCardYellow]}>
            <View style={styles.summaryIconWrapYellow}>
              <Ionicons name="time-outline" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.summaryNumberWhite}>
              {isLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : currentRequests}
            </Text>
            <Text style={styles.summaryLabelWhite}>Current Request</Text>
          </View>
          
          <View style={[styles.summaryCard, styles.summaryCardGradient]}>
            <View style={styles.gradientBackground} />
            <View style={styles.gradientOverlay} />
            <View style={styles.summaryCardContent}>
              <View style={styles.summaryIconWrapBlue}>
                <Ionicons name="checkmark-done-outline" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.summaryNumberWhite}>
                {isLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : completedBookings}
              </Text>
              <Text style={styles.summaryLabelWhite}>Completed</Text>
            </View>
          </View>
        </View>

        {/* Book a Car Wash Button */}
        <View style={styles.bookButtonContainer}>
          <TouchableOpacity style={styles.bookButton} onPress={onBookWash} activeOpacity={0.8}>
            <Text style={styles.bookButtonText}>Book a car wash</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity Section */}
        <View style={styles.activitySection}>
          <View style={styles.activityHeader}>
            <Text style={styles.activitySectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={onViewAll} style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>See all</Text>
              <Ionicons name="chevron-forward" size={16} color={BLUE_COLOR} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.activityList}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.text} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading recent activity...</Text>
              </View>
            ) : recentActivities.length > 0 ? (
              recentActivities.map(renderActivityItem)
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No recent activity</Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Book your first car wash to see activity here</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerIcons: { flexDirection: 'row', gap: 12 },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  welcomeText: { 
    fontSize: 13, 
    marginBottom: 2,
    fontFamily: 'Inter-Medium',
    color: '#666666',
  },
  userNameText: { 
    fontSize: 28, 
    fontWeight: '700',
    fontFamily: 'Montserrat-Bold',
    color: '#1A1A1A',
  },
  summaryCards: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  summaryCardGradient: {
    backgroundColor: 'rgba(3, 88, 168, 0.9)',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(3, 88, 168, 0.9)',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '70%',
    height: '70%',
    backgroundColor: 'rgba(2, 132, 199, 0.9)',
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
  },
  summaryCardContent: {
    position: 'relative',
    zIndex: 1,
    alignItems: 'center',
    width: '100%',
  },
  summaryCardBlue: {
    backgroundColor: BLUE_COLOR,
  },
  summaryCardYellow: {
    backgroundColor: YELLOW_COLOR,
  },
  summaryIconWrapBlue: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 8,
  },
  summaryIconWrapYellow: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 8,
  },
  summaryNumberWhite: { 
    fontSize: 22, 
    fontWeight: '700', 
    marginVertical: 6,
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
  },
  summaryLabelWhite: { 
    fontSize: 13, 
    textAlign: 'center',
    color: '#FFFFFF',
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  bookButtonContainer: {
    marginHorizontal: 20,
    marginBottom: 32,
    alignItems: 'center',
  },
  bookButton: {
    width: '100%',
    maxWidth: 400,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BLUE_COLOR,
    shadowColor: BLUE_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bookButtonText: { 
    fontSize: 16, 
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Inter-SemiBold',
  },
  activitySection: { paddingHorizontal: 20 },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activitySectionTitle: { 
    fontSize: 20, 
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Montserrat-SemiBold',
    letterSpacing: -0.3,
  },
  seeAllButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4,
  },
  seeAllText: { 
    fontSize: 15, 
    fontWeight: '600',
    color: BLUE_COLOR,
    fontFamily: 'Inter-SemiBold',
  },
  activityList: { gap: 12, paddingBottom: 20 },
  activityItem: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    fontSize: 18, 
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
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
  loadingContainer: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { 
    fontSize: 14, 
    marginTop: 12,
    fontFamily: 'Inter-Regular',
    color: '#666666',
  },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { 
    fontSize: 16, 
    fontWeight: '500', 
    marginBottom: 8,
    fontFamily: 'Inter-Medium',
    color: '#1A1A1A',
  },
  emptySubtext: { 
    fontSize: 14, 
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
    color: '#666666',
  },
});

export default DashboardScreen;
