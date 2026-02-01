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
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { platformEdges } from '../../utils/responsive';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authService from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';
import { FONTS } from '../../utils/fonts';

const BLUE_COLOR = '#0358a8';
const YELLOW_COLOR = '#f4c901';

interface UserData {
  id: string;
  fullName: string;
  name?: string;
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
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Local user data loaded from storage when prop is null (e.g. after app reload)
  const [localUserData, setLocalUserData] = useState<any>(null);
  const displayName = userData?.fullName || localUserData?.fullName || localUserData?.name || 'User';
  
  // State for bookings data
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceCenters, setServiceCenters] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Reschedule modal state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedBookingForReschedule, setSelectedBookingForReschedule] = useState<Booking | null>(null);
  const [rescheduleSelectedDate, setRescheduleSelectedDate] = useState<string>('');
  const [rescheduleSelectedTimeSlotId, setRescheduleSelectedTimeSlotId] = useState<string | number | null>(null);
  const [rescheduleSelectedTime, setRescheduleSelectedTime] = useState<string>('');
  const [rescheduleCurrentMonth, setRescheduleCurrentMonth] = useState<number>(new Date().getMonth());
  const [rescheduleCurrentYear, setRescheduleCurrentYear] = useState<number>(new Date().getFullYear());
  const [rescheduleTimeSlots, setRescheduleTimeSlots] = useState<any[]>([]);
  const [loadingRescheduleTimeSlots, setLoadingRescheduleTimeSlots] = useState<boolean>(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [showTimeSlotDropdown, setShowTimeSlotDropdown] = useState(false);

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

  // Always load user from storage on mount so name and data appear after app reload (when parent userData is not yet set)
  useEffect(() => {
    authService.getUser().then((user) => {
      if (user) setLocalUserData(user);
    });
  }, []);

  // Load bookings and service centers; delay slightly so token is ready after reload, then retry up to 2x if token wasn't ready
  useEffect(() => {
    loadServiceCenters();
    const delays = [300, 800, 2000]; // initial delay 300ms, then retry at 800ms and 2000ms if needed
    let step = 0;
    let timeouts: ReturnType<typeof setTimeout>[] = [];
    const run = async () => {
      const result = await loadBookings();
      if (result?.needsRetry && step < delays.length - 1) {
        step += 1;
        timeouts.push(setTimeout(run, delays[step]));
      }
    };
    timeouts.push(setTimeout(run, delays[0]));
    return () => timeouts.forEach((t) => clearTimeout(t));
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

  const loadBookings = async (): Promise<{ needsRetry?: boolean } | void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Loading bookings for dashboard...');
      const result = await authService.getBookingList();
      console.log('Dashboard booking list result:', JSON.stringify(result, null, 2));
      
      if (result.success && result.bookings) {
        console.log('Bookings loaded successfully for dashboard:', result.bookings.length);
        setBookings(Array.isArray(result.bookings) ? result.bookings : []);
        return;
      }
      setError(result.error || 'Failed to load bookings');
      setBookings([]);
      // Backend returned "Forbidden: not a visitor" — current token is not a visitor (e.g. owner). Log out so user can sign in with correct account.
      const isNotVisitor = result.error?.toLowerCase().includes('not a visitor') ?? false;
      if (isNotVisitor && onLogout) {
        onLogout();
        return;
      }
      // Retry once after a short delay if token may not have been ready (e.g. after app reload)
      const isTokenError = result.error?.toLowerCase().includes('login') ?? false;
      return isTokenError ? { needsRetry: true } : undefined;
    } catch (err) {
      console.error('Error loading bookings for dashboard:', err);
      setError('Failed to load bookings');
      setBookings([]);
      return { needsRetry: true };
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
    // Find the booking from activities
    const booking = bookings.find(b => b.booking_id === activity.id);
    if (booking) {
      setSelectedBookingForReschedule(booking);
      setShowRescheduleModal(true);
      // Initialize with today's date
      const today = new Date();
      setRescheduleCurrentMonth(today.getMonth());
      setRescheduleCurrentYear(today.getFullYear());
      setRescheduleSelectedDate('');
      setRescheduleSelectedTimeSlotId(null);
      setRescheduleSelectedTime('');
    }
  };

  // Helper function to check if a date is a weekoff day
  const isWeekoffDay = (date: Date, serviceCenter: any): boolean => {
    if (!serviceCenter?.weekoff_days || !Array.isArray(serviceCenter.weekoff_days) || serviceCenter.weekoff_days.length === 0) {
      return false;
    }
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[date.getDay()];
    return serviceCenter.weekoff_days.includes(dayName);
  };

  // Generate all time slots from 9 AM to 7 PM (30-minute intervals)
  const generateAllTimeSlots = (): any[] => {
    const slots: any[] = [];
    let hour = 9; // Start at 9 AM
    const endHour = 19; // End at 7 PM (19:00)
    
    while (hour < endHour) {
      const minutes = [0, 30]; // 30-minute intervals
      
      for (const minute of minutes) {
        const time24 = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
        const nextMinute = minute === 0 ? 30 : 0;
        const nextHour = minute === 30 ? hour + 1 : hour;
        const endTime24 = `${String(nextHour).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}:00`;
        
        // Format for display (12-hour format)
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const ampm = hour < 12 ? 'AM' : 'PM';
        const displayMinute = minute === 0 ? '00' : '30';
        const displayNextHour = nextHour === 0 ? 12 : nextHour > 12 ? nextHour - 12 : nextHour;
        const nextAmpm = nextHour < 12 ? 'AM' : 'PM';
        const nextDisplayMinute = nextMinute === 0 ? '00' : '30';
        
        const name = `${displayHour}:${displayMinute}${ampm}-${displayNextHour}:${nextDisplayMinute}${nextAmpm}`;
        
        slots.push({
          id: time24,
          name: name,
          start_time: time24,
          end_time: endTime24,
          available: 0,
          isAvailable: false,
        });
      }
      
      hour++;
    }
    
    return slots;
  };

  // Fetch time slots for reschedule
  const fetchRescheduleTimeSlots = async (date: string) => {
    if (!date || !selectedBookingForReschedule) {
      setRescheduleTimeSlots([]);
      return;
    }

    try {
      setLoadingRescheduleTimeSlots(true);
      setRescheduleSelectedTimeSlotId(null);
      setRescheduleSelectedTime('');

      // Format date as YYYY-MM-DD
      const dateObj = new Date(rescheduleCurrentYear, rescheduleCurrentMonth, parseInt(date));
      const formattedDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

      const centreId = selectedBookingForReschedule.service_centre_id;
      const result = await authService.getTimeSlotsForCentre(centreId, formattedDate);

      if (result.success && result.timeSlots && Array.isArray(result.timeSlots)) {
        // Only show available time slots (where available > 0)
        const availableSlots = result.timeSlots
          .filter((slot: any) => (slot.available || 0) > 0)
          .map((slot: any) => ({
            id: slot.id,
            name: slot.name || slot.time,
            start_time: slot.start_time,
            end_time: slot.end_time,
            available: slot.available,
            isAvailable: true,
          }));

        setRescheduleTimeSlots(availableSlots);
      } else {
        // No available slots
        setRescheduleTimeSlots([]);
      }
    } catch (error: any) {
      console.error('Error fetching reschedule time slots:', error);
      setRescheduleTimeSlots([]);
    } finally {
      setLoadingRescheduleTimeSlots(false);
    }
  };

  // Fetch time slots when date changes
  useEffect(() => {
    if (rescheduleSelectedDate && selectedBookingForReschedule) {
      fetchRescheduleTimeSlots(rescheduleSelectedDate);
    } else {
      setRescheduleTimeSlots([]);
    }
  }, [rescheduleSelectedDate, rescheduleCurrentMonth, rescheduleCurrentYear]);

  // Generate calendar days
  const generateRescheduleCalendarDays = () => {
    const days = [];
    const today = new Date();
    const currentDate = new Date(rescheduleCurrentYear, rescheduleCurrentMonth, 1);
    const lastDay = new Date(rescheduleCurrentYear, rescheduleCurrentMonth + 1, 0);
    
    const serviceCenter = serviceCenters.find(
      (sc: any) => sc.id === Number(selectedBookingForReschedule?.service_centre_id) || 
                   String(sc.id) === String(selectedBookingForReschedule?.service_centre_id)
    );
    
    // Add empty cells for days before month starts
    for (let i = 0; i < currentDate.getDay(); i++) {
      days.push({ day: '', isCurrentMonth: false, isSelected: false, isPast: false, isWeekoff: false });
    }
    
    // Add days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dayDate = new Date(rescheduleCurrentYear, rescheduleCurrentMonth, day);
      const startOfToday = new Date(today);
      startOfToday.setHours(0, 0, 0, 0);
      const isPast = dayDate.getTime() < startOfToday.getTime();
      const isWeekoff = serviceCenter ? isWeekoffDay(dayDate, serviceCenter) : false;
      
      days.push({
        day: day.toString(),
        isCurrentMonth: true,
        isSelected: day.toString() === rescheduleSelectedDate,
        isPast: isPast,
        isWeekoff: isWeekoff,
      });
    }
    
    return days;
  };

  const handleRescheduleDateSelect = (day: string, isPast: boolean, isWeekoff: boolean) => {
    if (day && day !== '' && !isPast && !isWeekoff) {
      setRescheduleSelectedDate(day);
    } else if (isWeekoff) {
      Alert.alert(
        'Service Center Closed',
        'This service center is closed on this day. Please select another date.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRescheduleTimeSelect = (timeSlot: any) => {
    // All slots shown are available, so we can directly select
    setRescheduleSelectedTimeSlotId(timeSlot.id);
    setRescheduleSelectedTime(timeSlot.name);
  };

  const handleRescheduleConfirm = async () => {
    if (!rescheduleSelectedDate || !rescheduleSelectedTimeSlotId) {
      Alert.alert('Error', 'Please select a date and time slot');
      return;
    }

    if (!selectedBookingForReschedule) {
      Alert.alert('Error', 'Booking information is missing');
      return;
    }

    setIsRescheduling(true);
    try {
      // Format date as YYYY-MM-DD for API
      const dateObj = new Date(rescheduleCurrentYear, rescheduleCurrentMonth, parseInt(rescheduleSelectedDate));
      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const year = dateObj.getFullYear();
      const formattedDate = `${year}-${month}-${day}`; // YYYY-MM-DD format

      // Get time slot ID
      const timeSlotId = rescheduleSelectedTimeSlotId;

      if (!timeSlotId) {
        Alert.alert('Error', 'Please select a time slot');
        setIsRescheduling(false);
        return;
      }

      // Call reschedule API with correct parameters
      // Use the numeric booking ID (id) - this is the booking's database ID
      const bookingId = String(selectedBookingForReschedule.id);
      
      console.log('Reschedule booking data:', {
        bookingId,
        bookingNumericId: selectedBookingForReschedule.id,
        bookingCode: selectedBookingForReschedule.booking_id,
        formattedDate,
        timeSlotId,
        serviceCentreId: selectedBookingForReschedule.service_centre_id,
      });
      
      const result = await authService.rescheduleBooking(
        bookingId,
        formattedDate,
        timeSlotId
      );

      if (result.success) {
        Alert.alert('Success', result.message || 'Booking rescheduled successfully');
        setShowRescheduleModal(false);
        await loadBookings();
      } else {
        Alert.alert('Error', result.error || 'Failed to reschedule booking. Please try again.');
      }
    } catch (error: any) {
      console.error('Reschedule error:', error);
      Alert.alert('Error', 'Failed to reschedule booking. Please try again.');
    } finally {
      setIsRescheduling(false);
    }
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
            <Text style={styles.userNameText}>{displayName}</Text>
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
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              authService.getUser().then((user) => {
                if (user) setLocalUserData(user);
              });
              loadServiceCenters();
              await loadBookings();
              setRefreshing(false);
            }}
            colors={[BLUE_COLOR]}
            tintColor={BLUE_COLOR}
          />
        }
      >
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

      {/* Reschedule Modal */}
      <Modal
        visible={showRescheduleModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRescheduleModal(false)}
      >
        <SafeAreaView style={styles.modalOverlay} edges={['bottom']}>
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={() => {
              setShowRescheduleModal(false);
              setShowTimeSlotDropdown(false);
            }}
          >
            <View 
              style={[styles.rescheduleModalContent, { backgroundColor: colors.card }]}
              onStartShouldSetResponder={() => true}
            >
              {/* Modal Header */}
              <View style={styles.rescheduleModalHeader}>
                <Text style={[styles.rescheduleModalTitle, { color: colors.text }]}>Reschedule Booking</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowRescheduleModal(false);
                    setShowTimeSlotDropdown(false);
                  }}
                  style={styles.rescheduleModalCloseButton}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.rescheduleModalScroll} 
                contentContainerStyle={styles.rescheduleModalScrollContent}
                showsVerticalScrollIndicator={false}
              >
              {/* Calendar Section - Smaller */}
              <View style={styles.rescheduleCalendarSection}>
                <Text style={[styles.rescheduleSectionTitle, { color: colors.text }]}>Select Date</Text>
                
                {/* Month Navigation */}
                <View style={styles.rescheduleMonthNavigation}>
                  <TouchableOpacity
                    onPress={() => {
                      if (rescheduleCurrentMonth === 0) {
                        setRescheduleCurrentMonth(11);
                        setRescheduleCurrentYear(rescheduleCurrentYear - 1);
                      } else {
                        setRescheduleCurrentMonth(rescheduleCurrentMonth - 1);
                      }
                    }}
                    style={styles.rescheduleMonthButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-back" size={18} color="#6B7280" />
                  </TouchableOpacity>
                  
                  <Text style={[styles.rescheduleMonthText, { color: colors.text }]}>
                    {getMonthName(rescheduleCurrentMonth)} {rescheduleCurrentYear}
                  </Text>
                  
                  <TouchableOpacity
                    onPress={() => {
                      if (rescheduleCurrentMonth === 11) {
                        setRescheduleCurrentMonth(0);
                        setRescheduleCurrentYear(rescheduleCurrentYear + 1);
                      } else {
                        setRescheduleCurrentMonth(rescheduleCurrentMonth + 1);
                      }
                    }}
                    style={styles.rescheduleMonthButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-forward" size={18} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                {/* Calendar Days - Smaller */}
                <View style={styles.rescheduleCalendarGrid}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <View key={index} style={styles.rescheduleCalendarDayHeader}>
                      <Text style={[styles.rescheduleCalendarDayHeaderText, { color: colors.textSecondary }]}>{day}</Text>
                    </View>
                  ))}
                  {generateRescheduleCalendarDays().map((dayData, index) => {
                    const isDisabled = !dayData.isCurrentMonth || dayData.isPast || dayData.isWeekoff;
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.rescheduleCalendarDay,
                          dayData.isSelected && [styles.rescheduleCalendarDaySelected, { backgroundColor: BLUE_COLOR }],
                          !dayData.isCurrentMonth && styles.rescheduleCalendarDayInactive,
                          dayData.isPast && styles.rescheduleCalendarDayPast,
                          dayData.isWeekoff && styles.rescheduleCalendarDayWeekoff,
                        ]}
                        onPress={() => handleRescheduleDateSelect(dayData.day, dayData.isPast, dayData.isWeekoff)}
                        disabled={isDisabled}
                      >
                        <Text style={[
                          styles.rescheduleCalendarDayText,
                          { color: colors.text },
                          dayData.isSelected && [styles.rescheduleCalendarDayTextSelected, { color: '#FFFFFF' }],
                          !dayData.isCurrentMonth && { color: colors.textSecondary },
                          dayData.isPast && { color: colors.textSecondary },
                          dayData.isWeekoff && { color: colors.textSecondary },
                        ]}>
                          {dayData.day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Time Slots Section - Dropdown Style */}
              {rescheduleSelectedDate && (
                <View style={styles.rescheduleTimeSlotsSection}>
                  <Text style={[styles.rescheduleTimeSlotLabel, { color: colors.text }]}>Select Time Slot</Text>
                  
                  {loadingRescheduleTimeSlots ? (
                    <View style={styles.rescheduleLoadingContainer}>
                      <ActivityIndicator size="small" color={BLUE_COLOR} />
                      <Text style={[styles.rescheduleLoadingText, { color: colors.textSecondary }]}>Loading time slots...</Text>
                    </View>
                  ) : rescheduleTimeSlots.length > 0 ? (
                    <View style={styles.rescheduleDropdownContainer}>
                      <TouchableOpacity
                        style={[
                          styles.rescheduleDropdownButton, 
                          { 
                            borderColor: showTimeSlotDropdown ? BLUE_COLOR : '#D1D5DB',
                            backgroundColor: '#FFFFFF'
                          }
                        ]}
                        onPress={() => setShowTimeSlotDropdown(!showTimeSlotDropdown)}
                        activeOpacity={0.8}
                      >
                        <Text style={[
                          styles.rescheduleDropdownButtonText,
                          { color: rescheduleSelectedTime ? colors.text : colors.textSecondary }
                        ]}>
                          {rescheduleSelectedTime || 'Select time slot'}
                          {rescheduleSelectedTime && rescheduleTimeSlots.find(s => s.id === rescheduleSelectedTimeSlotId) && 
                            ` (${rescheduleTimeSlots.find(s => s.id === rescheduleSelectedTimeSlotId)?.available || 0} left)`
                          }
                        </Text>
                        <Ionicons 
                          name={showTimeSlotDropdown ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          color={showTimeSlotDropdown ? BLUE_COLOR : '#6B7280'} 
                        />
                      </TouchableOpacity>

                      {showTimeSlotDropdown && (
                        <View style={[styles.rescheduleDropdownList, { 
                          backgroundColor: colors.card,
                          borderColor: colors.border 
                        }]}>
                          <ScrollView 
                            style={styles.rescheduleDropdownScroll}
                            nestedScrollEnabled={true}
                            showsVerticalScrollIndicator={true}
                          >
                            {rescheduleTimeSlots.map((timeSlot, index) => {
                              const isSelected = rescheduleSelectedTimeSlotId === timeSlot.id;
                              
                              return (
                                <TouchableOpacity
                                  key={`${timeSlot.id}-${index}`}
                                  style={[
                                    styles.rescheduleDropdownItem,
                                    isSelected && { 
                                      backgroundColor: BLUE_COLOR + '10',
                                      borderLeftWidth: 3,
                                      borderLeftColor: BLUE_COLOR,
                                    },
                                    { borderBottomColor: '#F3F4F6' }
                                  ]}
                                  onPress={() => {
                                    handleRescheduleTimeSelect(timeSlot);
                                    setShowTimeSlotDropdown(false);
                                  }}
                                  activeOpacity={0.6}
                                >
                                  <Text style={[
                                    styles.rescheduleDropdownItemText,
                                    { color: isSelected ? BLUE_COLOR : '#374151' },
                                    isSelected && { fontWeight: '600', fontFamily: FONTS.INTER_SEMIBOLD }
                                  ]}>
                                    {timeSlot.name} ({timeSlot.available || 0} left)
                                  </Text>
                                  {isSelected && (
                                    <View style={styles.rescheduleDropdownCheckmark}>
                                      <Ionicons name="checkmark-circle" size={22} color={BLUE_COLOR} />
                                    </View>
                                  )}
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.rescheduleNoSlotsContainer}>
                      <Ionicons name="time-outline" size={32} color={colors.textSecondary} />
                      <Text style={[styles.rescheduleNoSlotsText, { color: colors.textSecondary }]}>
                        No available time slots
                      </Text>
                      <Text style={[styles.rescheduleNoSlotsSubtext, { color: colors.textSecondary }]}>
                        Please select another date
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Confirm Button */}
              <TouchableOpacity
                style={[
                  styles.rescheduleConfirmButton,
                  { backgroundColor: BLUE_COLOR },
                  (!rescheduleSelectedDate || !rescheduleSelectedTimeSlotId) && styles.rescheduleConfirmButtonDisabled
                ]}
                onPress={handleRescheduleConfirm}
                disabled={!rescheduleSelectedDate || !rescheduleSelectedTimeSlotId || isRescheduling}
                activeOpacity={0.8}
              >
                {isRescheduling ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.rescheduleConfirmButtonText}>Confirm Reschedule</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const getMonthName = (month: number) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month];
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
  // Reschedule Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalOverlayTouchable: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  rescheduleModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flex: 1,
    maxHeight: '90%',
    paddingBottom: 0,
  },
  rescheduleModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  rescheduleModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: FONTS.INTER_BOLD,
    letterSpacing: -0.3,
  },
  rescheduleModalCloseButton: {
    padding: 4,
  },
  rescheduleModalScroll: {
    flex: 1,
  },
  rescheduleModalScrollContent: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  rescheduleCalendarSection: {
    padding: 20,
    paddingBottom: 16,
    backgroundColor: '#F9FAFB',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  rescheduleSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
    marginBottom: 14,
    color: '#111827',
    letterSpacing: 0.2,
  },
  rescheduleMonthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  rescheduleMonthButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  rescheduleMonthText: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: FONTS.INTER_BOLD,
    color: '#111827',
    letterSpacing: -0.2,
  },
  rescheduleCalendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  rescheduleCalendarDayHeader: {
    width: '13%',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 4,
  },
  rescheduleCalendarDayHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rescheduleCalendarDay: {
    width: '13%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rescheduleCalendarDaySelected: {
    backgroundColor: BLUE_COLOR,
    borderColor: BLUE_COLOR,
    shadowColor: BLUE_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  rescheduleCalendarDayInactive: {
    opacity: 0.25,
    backgroundColor: '#F3F4F6',
  },
  rescheduleCalendarDayPast: {
    opacity: 0.4,
    backgroundColor: '#F9FAFB',
  },
  rescheduleCalendarDayWeekoff: {
    opacity: 0.4,
    backgroundColor: '#FEF2F2',
  },
  rescheduleCalendarDayText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
    color: '#374151',
  },
  rescheduleCalendarDayTextSelected: {
    color: '#FFFFFF',
  },
  rescheduleTimeSlotsSection: {
    padding: 20,
    paddingTop: 16,
  },
  rescheduleTimeSlotLabel: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
    marginBottom: 12,
    color: '#111827',
    letterSpacing: 0.2,
  },
  rescheduleDropdownContainer: {
    position: 'relative',
    zIndex: 10,
  },
  rescheduleDropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  rescheduleDropdownButtonText: {
    fontSize: 16,
    fontFamily: FONTS.INTER_MEDIUM,
    flex: 1,
    color: '#111827',
    fontWeight: '500',
  },
  rescheduleDropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 6,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    maxHeight: 250,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 1000,
    overflow: 'hidden',
  },
  rescheduleDropdownScroll: {
    maxHeight: 250,
  },
  rescheduleDropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 0,
  },
  rescheduleDropdownItemText: {
    fontSize: 15,
    fontFamily: FONTS.INTER_MEDIUM,
    flex: 1,
    color: '#374151',
    fontWeight: '500',
  },
  rescheduleDropdownCheckmark: {
    marginLeft: 8,
  },
  rescheduleLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  rescheduleLoadingText: {
    fontSize: 14,
    fontFamily: FONTS.INTER_REGULAR,
  },
  rescheduleTimeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  rescheduleTimeSlotButton: {
    borderRadius: 12,
    width: '46%',
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    position: 'relative',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rescheduleTimeSlotButtonSelectedAvailable: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  rescheduleTimeSlotButtonAvailable: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  rescheduleTimeSlotButtonUnavailable: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  rescheduleTimeSlotText: {
    fontSize: 15,
    fontFamily: FONTS.INTER_MEDIUM,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  rescheduleTimeSlotTextSelectedAvailable: {
    color: '#10B981',
    fontWeight: '500',
  },
  rescheduleTimeSlotTextAvailable: {
    color: '#10B981',
    fontWeight: '500',
  },
  rescheduleTimeSlotTextUnavailable: {
    color: '#6B7280',
    fontWeight: '400',
  },
  rescheduleTimeSlotCheckmark: {
    position: 'absolute',
    top: '50%',
    right: 10,
    marginTop: -9,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rescheduleConfirmButton: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 20,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BLUE_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  rescheduleConfirmButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  rescheduleConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: FONTS.INTER_BOLD,
    letterSpacing: 0.3,
  },
  rescheduleNoSlotsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  rescheduleNoSlotsText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
    marginTop: 16,
    marginBottom: 8,
  },
  rescheduleNoSlotsSubtext: {
    fontSize: 14,
    fontFamily: FONTS.INTER_REGULAR,
    textAlign: 'center',
  },
});

export default DashboardScreen;
