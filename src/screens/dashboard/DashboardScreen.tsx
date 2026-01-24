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

  // Format date and time for display: "24 Jan 2026 09AM-09:30AM"
  const formatDateTimeRange = (bookingDate: string, bookingTime: string): string => {
    try {
      if (!bookingDate) return '';
      
      // Format date: "24 Jan 2026"
      const date = new Date(bookingDate);
      const day = date.getDate();
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear();
      
      // Format time: "09AM-09:30AM"
      let timeRange = '';
      if (bookingTime) {
        try {
          // Handle time format like "09:00:00" or "09:00"
          const [hours, minutes] = bookingTime.split(':');
          const startHour = parseInt(hours);
          const startMin = minutes ? parseInt(minutes) : 0;
          
          // Calculate end time (assuming 30 min duration)
          const endMin = startMin + 30;
          const endHour = endMin >= 60 ? startHour + 1 : startHour;
          const finalEndMin = endMin >= 60 ? endMin - 60 : endMin;
          
          const formatTime = (hour: number, min: number) => {
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            // Format: "09AM" or "09:30AM"
            if (min === 0) {
              return `${displayHour.toString().padStart(2, '0')}${ampm}`;
            } else {
              return `${displayHour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}${ampm}`;
            }
          };
          
          const startTimeStr = formatTime(startHour, startMin);
          const endTimeStr = formatTime(endHour, finalEndMin);
          timeRange = `${startTimeStr}-${endTimeStr}`;
        } catch (error) {
          // Fallback: just format the start time
          const hour = parseInt(bookingTime.split(':')[0]);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour % 12 || 12;
          timeRange = `${displayHour.toString().padStart(2, '0')}${ampm}`;
        }
      }
      
      return timeRange ? `${day} ${month} ${year} · ${timeRange}` : `${day} ${month} ${year}`;
    } catch (error) {
      return '';
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


  // Calculate booking statistics
  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter(booking => {
    const mappedStatus = mapBookingStatus(booking.status);
    return mappedStatus === 'In Progress';
  }).length;
  const completedBookings = bookings.filter(booking => {
    const mappedStatus = mapBookingStatus(booking.status);
    return mappedStatus === 'Completed';
  }).length;

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

  const renderActivityItem = (activity: Activity) => {
    const dateTimeStr = formatDateTimeRange(activity.bookingDate || '', activity.bookingTime || '');
    
    return (
      <TouchableOpacity
        key={activity.id}
        style={[
          styles.activityItem,
          Platform.OS === 'android' 
            ? { backgroundColor: '#F9FAFB', borderColor: '#D1D5DB' }
            : { backgroundColor: colors.card, borderColor: colors.border }
        ]}
        onPress={() => onActivityPress?.(activity)}
      >
        <View style={styles.activityContent}>
          <View style={styles.activityInfo}>
            {/* Service Name */}
            <View style={styles.titleRow}>
              <Text style={styles.serviceName}>{activity.title}</Text>
            </View>

            {/* Service Type Line: "Full Valet · In Progress" */}
            {activity.serviceType && (
              <View style={styles.serviceTypeRow}>
                <Ionicons name="water-outline" size={13} color="#6B7280" style={styles.serviceTypeIcon} />
                <Text style={styles.serviceTypeText}>
                  {activity.serviceType}
                  {activity.status === 'In Progress' && (
                    <>
                      {' · '}
                      <Text style={styles.inProgressText}>In Progress</Text>
                    </>
                  )}
                </Text>
              </View>
            )}

            {/* Meta Info: Date and Time */}
            {dateTimeStr && (
              <View style={styles.metaInfoRow}>
                <Ionicons name="calendar-outline" size={13} color="#9CA3AF" style={styles.metaIcon} />
                <Text style={styles.metaInfoText}>
                  {dateTimeStr}
                </Text>
              </View>
            )}

            {/* Vehicle No. */}
            {activity.vehicleNo && (
              <View style={styles.metaInfoRow}>
                <Ionicons name="car-outline" size={13} color="#9CA3AF" style={styles.metaIcon} />
                <Text style={styles.metaInfoText}>
                  Vehicle: {activity.vehicleNo}
                </Text>
              </View>
            )}

            {/* Booking Number (Important) */}
            {activity.bookingCode && (
              <View style={styles.bookingNumberRow}>
                <Ionicons name="receipt-outline" size={14} color="#6B7280" style={styles.bookingNumberIcon} />
                <Text style={styles.bookingNumberLabel}>Booking No: </Text>
                <Text style={styles.bookingNumberValue}>{activity.bookingCode}</Text>
              </View>
            )}

            {/* Action Buttons */}
            {activity.status === 'In Progress' && (
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleCancel(activity.id);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel Booking</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rescheduleButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleReschedule(activity);
                  }}
                >
                  <Text style={styles.rescheduleButtonText}>Reschedule</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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

  const handleReschedule = (activity: Activity) => {
    // Navigate to reschedule screen or show reschedule options
    // For now, we'll just show an alert - this can be connected to navigation later
    Alert.alert(
      'Reschedule Booking',
      'Reschedule functionality will be implemented soon.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* BLUE HEADER WITH CURVE */}
      <View style={[styles.headerSection, { paddingTop: insets.top + 10 }]}>
        {/* Decorative Dots */}
        <View style={styles.decorativeDot1} />
        <View style={styles.decorativeDot2} />
        <View style={styles.decorativeDot3} />
        <View style={styles.decorativeDot4} />
        <View style={styles.decorativeDot5} />
        
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeText}>Welcome to Kwik Wash,</Text>
            <Text style={styles.userNameText}>{firstName}</Text>
          </View>
          <TouchableOpacity style={styles.iconButton} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={25} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Booking Statistics Cards - Inside Blue Header */}
        <View style={styles.statsContainerBlue}>
          <View style={styles.statCardBlue}>
            <View style={[styles.statIconContainerBlue, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.statValueBlue}>{totalBookings}</Text>
            <Text style={styles.statLabelBlue}>Total Bookings</Text>
          </View>

          <View style={styles.statCardBlue}>
            <View style={[styles.statIconContainerBlue, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <Ionicons name="time-outline" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.statValueBlue}>{pendingBookings}</Text>
            <Text style={styles.statLabelBlue}>Pending</Text>
          </View>

          <View style={styles.statCardBlue}>
            <View style={[styles.statIconContainerBlue, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.statValueBlue}>{completedBookings}</Text>
            <Text style={styles.statLabelBlue}>Completed</Text>
          </View>
        </View>
      </View>

      {/* Yellow Book a Car Wash Card - Only button is clickable */}
      <View style={styles.yellowBanner}>
        <View style={styles.yellowBannerContent}>
          <View style={{ flex: 1 }}>
            <Text style={styles.yellowBannerTitle}>Book a Car Wash</Text>
            <Text style={styles.yellowBannerSubtitle}>
              Schedule your next{'\n'}wash in seconds
            </Text>
          </View>
          <TouchableOpacity
            style={styles.bookNowButton}
            onPress={onBookWash}
            activeOpacity={0.7}
          >
            <Ionicons name="car" size={22} color="#111827" style={{ marginRight: 8 }} />
            <Text style={styles.bookNowText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* WHITE CONTENT */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
    paddingBottom: 20, // Add bottom padding for stats cards
    borderBottomLeftRadius: 0, // No curve - straight edge
    borderBottomRightRadius: 0, // No curve - straight edge
    overflow: 'visible', // Allow yellow card to overlap
    position: 'relative',
    zIndex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12, // Reduced margin
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
    includeFontPadding: false,
  },
  userNameText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    fontFamily: 'Montserrat-Bold',
    letterSpacing: -0.5,
    includeFontPadding: false,
    marginTop: 2,
  },
  iconButton: {
    padding: 6,
  },
  decorativeDot1: {
    position: 'absolute',
    top: 96,
    right: 80,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  decorativeDot2: {
    position: 'absolute',
    top: 128,
    right: 128,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  decorativeDot3: {
    position: 'absolute',
    top: 112,
    right: 48,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  decorativeDot4: {
    position: 'absolute',
    bottom: 96,
    left: 48,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  decorativeDot5: {
    position: 'absolute',
    bottom: 80,
    left: 96,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: -30, // Increased negative margin to remove extra blue background
  },
  scrollContent: {
    paddingTop: 30, // Increased padding to account for yellow card overlap and add space
  },
  statsContainerBlue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 10,
  },
  statCardBlue: {
    flex: 1,
    backgroundColor: Platform.select({
      android: BLUE_COLOR, // Solid blue color for Android
      ios: 'rgba(255, 255, 255, 0.15)', // Glassmorphism effect for iOS
    }),
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Platform.select({
      android: 'rgba(255, 255, 255, 0.3)', // Slightly more visible border for Android
      ios: 'rgba(255, 255, 255, 0.2)',
    }),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainerBlue: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValueBlue: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 2,
    includeFontPadding: false,
  },
  statLabelBlue: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.9)',
    includeFontPadding: false,
  },
  yellowBanner: {
    marginHorizontal: 20, // Increased margin for better width
    marginTop: -25, // Increased overlap to cover blue background
    backgroundColor: YELLOW_COLOR,
    paddingVertical: 16, // Adjusted vertical padding for better height
    paddingHorizontal: 20, // Keep horizontal padding
    borderRadius: 20, // Slightly reduced border radius
    marginBottom: 0, // Remove bottom margin to eliminate blue gap
    zIndex: 20, // Higher zIndex to ensure it's on top of blue section
    borderWidth: 6, // Increased border thickness for more prominent white border
    borderColor: '#FFFFFF', // White border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: Platform.select({
      ios: 0.25,
      android: 0.3,
    }),
    shadowRadius: Platform.select({
      ios: 12,
      android: 14,
    }),
    elevation: Platform.select({
      ios: 10,
      android: 12,
    }),
  },
  yellowBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  yellowBannerTitle: {
    fontSize: 18, // Further reduced
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginBottom: 4,
    includeFontPadding: false,
  },
  yellowBannerSubtitle: {
    fontSize: 12, // Further reduced
    fontFamily: 'Inter-Regular',
    fontWeight: '400',
    color: '#374151',
    includeFontPadding: false,
  },
  bookNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF08A', // Soft, light yellow color
    paddingHorizontal: 22, // Increased width
    paddingVertical: 8, // Reduced height
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)', // More visible white border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  bookNowText: {
    fontSize: 13,
    fontWeight: '600', // Increased to Semi-Bold
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    includeFontPadding: false,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 24, // Added top margin to create space between yellow card and text
    marginBottom: 16,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18, // 18px
    fontWeight: '600', // Semi-Bold
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    includeFontPadding: false,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB', // Subtle border
    padding: 14, // Reduced padding to decrease height
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: Platform.select({
      ios: 0.06,
      android: 0.08,
    }),
    shadowRadius: Platform.select({
      ios: 8,
      android: 10,
    }),
    elevation: Platform.select({
      ios: 3,
      android: 5,
    }),
  },
  activityContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  activityInfo: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  serviceName: { 
    fontSize: 17,
    fontWeight: '600', // Semi-Bold
    flex: 1,
    fontFamily: 'Inter-SemiBold',
    color: BLUE_COLOR, // Blue color for center name
    includeFontPadding: false,
    marginBottom: 0,
  },
  activityService: { 
    fontSize: 13, 
    marginBottom: 4,
    fontFamily: 'Inter-Regular',
    color: '#666666',
  },
  serviceTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  serviceTypeIcon: {
    marginRight: 6,
  },
  serviceTypeText: {
    fontSize: 13,
    fontWeight: '500', // Medium
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  inProgressText: {
    fontSize: 13,
    fontWeight: '600', // Semi-Bold (increased from Medium)
    fontFamily: 'Inter-SemiBold',
    color: '#10B981', // Green color
  },
  metaInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 2,
  },
  metaIcon: {
    marginRight: 6,
  },
  metaInfoText: {
    fontSize: 13,
    fontWeight: '400', // Regular
    fontFamily: 'Inter-Regular',
    color: '#6B7280', // Darker gray for better readability
  },
  bookingNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6', // Subtle divider
  },
  bookingNumberIcon: {
    marginRight: 6,
  },
  bookingNumberLabel: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  bookingNumberValue: {
    fontSize: 16,
    fontWeight: '600', // Reduced from 700 to 600
    fontFamily: 'Inter-SemiBold',
    color: '#111827', // Dark blue/black
    lineHeight: 20.8, // 1.3 line height (16 * 1.3)
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  statusBadgeGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981', // Green pill background
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20, // Pill shape
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12.5, // 12-13px, using 12.5px
    fontWeight: '500', // Medium
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.2,
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
    flex: 1,
    borderWidth: 1.5, // Add border line
    borderColor: '#9CA3AF', // Gray border color
    backgroundColor: '#FCA5A5', // Lighter red filled color
    paddingHorizontal: 8, // Further reduced width
    paddingVertical: 10,
    borderRadius: 25, // Cylindrical/pill shape
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FCA5A5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButtonText: {
    color: '#991B1B', // Darker red text for contrast on light background
    fontWeight: '600', // Semi-Bold
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  rescheduleButton: {
    flex: 1,
    borderWidth: 1.5, // Add border line
    borderColor: '#9CA3AF', // Gray border color
    backgroundColor: '#93C5FD', // Lighter blue filled color
    paddingHorizontal: 8, // Further reduced width
    paddingVertical: 10,
    borderRadius: 25, // Cylindrical/pill shape
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#93C5FD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  rescheduleButtonText: {
    color: '#1E40AF', // Darker blue text for contrast on light background
    fontWeight: '600', // Semi-Bold
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
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
