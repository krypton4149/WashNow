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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  carmodel?: string;
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
  carmodel?: string;
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

  // Show only first two words of centre name (e.g. "Harrow Hand" not "Harrow Hand Car Centre")
  const displayCentreName = fullName.trim().split(/\s+/).slice(0, 2).join(' ') || fullName;

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
      carmodel: booking.carmodel || undefined,
      bookingCode: booking.booking_id,
      paymentMethod: booking.notes || undefined,
      customerName: booking.visitor?.name,
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

            {/* Car Model */}
            {activity.carmodel && activity.carmodel.trim() !== '' && (
              <View style={styles.metaInfoRow}>
                <Ionicons name="car-sport-outline" size={13} color="#9CA3AF" style={styles.metaIcon} />
                <Text style={styles.metaInfoText}>
                  Model: {activity.carmodel}
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
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleCancel(activity.id);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel Booking</Text>
              </TouchableOpacity>
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

  const insets = useSafeAreaInsets();

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
            <Text style={styles.userNameText} numberOfLines={1} ellipsizeMode="tail">{displayCentreName}</Text>
          </View>
          <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={25} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Booking Statistics Cards - Inside Blue Header */}
        <View style={styles.statsContainerBlue}>
          <View style={styles.statCardBlue}>
            <View style={[styles.statIconContainerBlue, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
            </View>
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginVertical: 4 }} />
            ) : (
              <Text style={styles.statValueBlue}>{totalBookings}</Text>
            )}
            <Text style={styles.statLabelBlue}>Total</Text>
          </View>

          <View style={styles.statCardBlue}>
            <View style={[styles.statIconContainerBlue, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <Ionicons name="time-outline" size={18} color="#FFFFFF" />
            </View>
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginVertical: 4 }} />
            ) : (
              <Text style={styles.statValueBlue}>{currentRequests}</Text>
            )}
            <Text style={styles.statLabelBlue}>Pending</Text>
          </View>

          <View style={styles.statCardBlue}>
            <View style={[styles.statIconContainerBlue, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
            </View>
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginVertical: 4 }} />
            ) : (
              <Text style={styles.statValueBlue}>{completedBookings}</Text>
            )}
            <Text style={styles.statLabelBlue}>Done</Text>
          </View>
        </View>
      </View>

      {/* Yellow Book a Car Wash Card - Only button is clickable */}
      <View style={styles.yellowBanner}>
        <View style={styles.yellowBannerContent}>
          <View style={{ flex: 1 }}>
            <Text style={styles.yellowBannerTitle}>View Booking Requests</Text>
            <Text style={styles.yellowBannerSubtitle}>
              Manage and respond to{'\n'}customer bookings
            </Text>
          </View>
          <TouchableOpacity
            style={styles.bookNowButton}
            onPress={onBookingRequestPress || onBookWash}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={22} color="#111827" style={{ marginRight: 8 }} />
            <Text style={styles.bookNowText}>View</Text>
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
  welcomeText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
    includeFontPadding: false,
  },
  userNameText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Montserrat-SemiBold',
    letterSpacing: -0.5,
    includeFontPadding: false,
    marginTop: 2,
    flex: 1,
  },
  iconButton: {
    padding: 6,
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
  cancelButton: {
    marginTop: 6,
    alignSelf: 'flex-start',
    borderWidth: 1.5, // Add border line
    borderColor: '#9CA3AF', // Gray border color
    backgroundColor: '#FCA5A5', // Lighter red filled color
    paddingHorizontal: 16,
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

export default OwnerDashboardScreen;

