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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
  carmodel?: string;
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
  carmodel?: string;
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
  const insets = useSafeAreaInsets();
  
  // State for bookings data
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceCenters, setServiceCenters] = useState<any[]>([]);

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

  // Load bookings data and service centers
  useEffect(() => {
    loadServiceCenters();
    loadBookings();
  }, []);

  const loadServiceCenters = async () => {
    try {
      const result = await authService.getServiceCenters();
      if (result.success && result.serviceCenters) {
        setServiceCenters(result.serviceCenters);
      }
    } catch (error) {
      console.error('Error loading service centers:', error);
    }
  };

  // Find service center name by ID
  const getServiceCenterName = (serviceCentreId: number | string): string => {
    if (!serviceCenters.length) {
      return `Service Center ${serviceCentreId}`;
    }
    
    const center = serviceCenters.find(
      (sc: any) => sc.id === Number(serviceCentreId) || String(sc.id) === String(serviceCentreId)
    );
    
    return center?.name || `Service Center ${serviceCentreId}`;
  };

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
      title: getServiceCenterName(booking.service_centre_id),
      serviceType: booking.service_type,
      time: formatBookingTime(booking.booking_date, booking.created_at),
      status: mapBookingStatus(booking.status),
      bookingDate: booking.booking_date,
      bookingTime: booking.booking_time,
      vehicleNo: booking.vehicle_no,
      carmodel: booking.carmodel ? String(booking.carmodel).trim() : undefined,
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
          {activity.serviceType ? (
            <View style={styles.recentRow}>
              <Ionicons name="sparkles-outline" size={16} color={BLUE_COLOR} style={styles.recentIcon} />
              <Text style={[styles.recentText, { color: colors.text }]}>{activity.serviceType}</Text>
            </View>
          ) : null}
          {activity.vehicleNo ? (
            <View style={styles.recentRow}>
              <Ionicons name="car-outline" size={16} color={colors.textSecondary} style={styles.recentIcon} />
              <Text style={[styles.recentText, { color: colors.textSecondary }]}>Vehicle: {activity.vehicleNo}</Text>
            </View>
          ) : null}
          {activity.carmodel && activity.carmodel.trim() !== '' ? (
            <View style={styles.recentRow}>
              <Ionicons name="car-sport-outline" size={16} color={colors.textSecondary} style={styles.recentIcon} />
              <Text style={[styles.recentText, { color: colors.textSecondary }]}>Model: {activity.carmodel}</Text>
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
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* BLUE HEADER WITH CURVE */}
      <View style={[styles.headerSection, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeText}>Welcome to Kwik Wash,</Text>
            <Text style={styles.userNameText}>{firstName}</Text>
          </View>
          <TouchableOpacity style={styles.iconButton} onPress={onLogout}>
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
          onPress={onBookWash}
          activeOpacity={0.8}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Book a Car Wash</Text>
            <Text style={styles.bannerSubtitle}>
              Schedule your next car wash service
            </Text>
          </View>
          <Ionicons name="car-outline" size={24} color="#1A1A1A" />
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
            <Text style={styles.emptySubtext}>Book your first car wash to see activity here</Text>
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
    fontSize: 14, // font-size: 14px, font-weight: 400 (Regular) - Welcome text
    fontFamily: 'Inter-Regular',
    fontWeight: '400',
  },
  userNameText: {
    color: '#fff',
    fontSize: 22, // Reduced from 28 for better proportions
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
    fontSize: 20, // Keep large for emphasis
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginVertical: 4,
  },
  metricLabel: {
    color: '#fff',
    fontSize: 13, // font-size: 13px, font-weight: 400 (Regular) - Metric label
    fontFamily: 'Inter-Regular',
    fontWeight: '400',
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
    fontSize: 17, // font-size: 17px, font-weight: 600 (Semibold) - Banner title
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#1A1A1A',
    marginBottom: 3,
  },
  bannerSubtitle: {
    fontSize: 14, // font-size: 14px, font-weight: 400 (Regular) - Banner subtitle
    fontFamily: 'Inter-Regular',
    fontWeight: '400',
    color: '#1A1A1A',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 22, // font-size: 22px, font-weight: 700 (Bold) - Section title
    fontWeight: '700',
    fontFamily: 'Montserrat-Bold',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14, // font-size: 14px, font-weight: 400 (Regular) - See all text
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    color: BLUE_COLOR,
    marginRight: 4,
  },
  activityItem: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12, // Reduced padding
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
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
    fontSize: 17, // font-size: 17px, font-weight: 600 (Semibold) - Activity title
    fontWeight: '600', 
    flex: 1,
    fontFamily: 'Montserrat-SemiBold',
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
    fontSize: 13, // font-size: 13px, font-weight: 400 (Regular) - Time text
    fontFamily: 'Inter-Regular',
    fontWeight: '400',
    color: '#666666',
  },
  recentRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  recentIcon: { marginRight: 6 },
  recentText: { 
    fontSize: 14, // font-size: 14px, font-weight: 400 (Regular) - Recent text
    fontFamily: 'Inter-Regular',
    fontWeight: '400',
    color: '#666666',
  },
  recentBookingId: { 
    fontSize: 14, // font-size: 14px, font-weight: 500 (Medium) - Booking ID
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
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
    fontSize: 13, // font-size: 13px, font-weight: 500 (Medium) - Status text
    fontWeight: '500',
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
    fontSize: 13, // font-size: 13px, font-weight: 500 (Medium) - Status text
    fontWeight: '500',
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
    fontSize: 13, // font-size: 13px, font-weight: 500 (Medium) - Status text
    fontWeight: '500',
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
    fontWeight: '500',
    fontSize: 13, // font-size: 13px, font-weight: 500 (Medium) - Cancel button
    fontFamily: 'Inter-Medium',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14, // font-size: 14px, font-weight: 400 (Regular) - Loading text
    fontFamily: 'Inter-Regular',
    fontWeight: '400',
    color: '#666',
    marginTop: 12,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14, // font-size: 14px, font-weight: 400 (Regular) - Empty text
    fontFamily: 'Inter-Regular',
    fontWeight: '400',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13, // font-size: 13px, font-weight: 400 (Regular) - Empty subtext
    fontFamily: 'Inter-Regular',
    fontWeight: '400',
    color: '#666',
    textAlign: 'center',
  },
});

export default DashboardScreen;
