import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authService from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';
import { platformEdges, moderateScale } from '../../utils/responsive';
import { FONTS, FONT_SIZES, TEXT_STYLES } from '../../utils/fonts';

const BLUE_COLOR = '#0358a8';

// Responsive card dimensions (align with dashboard)
const CARD_RADIUS = moderateScale(16);
const CARD_PADDING = moderateScale(14);
const CARD_MARGIN_BOTTOM = moderateScale(12);
const CARD_HEADER_PADDING_V = moderateScale(12);
const CARD_HEADER_PADDING_H = moderateScale(16);
const LIST_PADDING_H = moderateScale(16);
const LIST_PADDING_TOP = moderateScale(16);
const LIST_PADDING_BOTTOM = moderateScale(24);
const BUTTON_MIN_HEIGHT = moderateScale(44);

interface Booking {
  id: number;
  booking_id: string;
  visitor_id: number;
  service_centre_id: number;
  service_type: string;
  service_id?: number;
  service_name?: string;
  service_price?: string;
  service_offer_price?: string;
  vehicle_no: string;
  carmodel?: string;
  booking_date: string;
  booking_time: string;
  notes: string;
  status: string;
  cancel_by: string | null;
  tenant_id: number;
  created_at: string;
  createdAt?: string;
  updated_at: string;
  service_centre?: {
    id: number;
    name: string;
    address?: string;
  };
  service?: {
    id: number;
    name: string;
    price: string;
    offer_price?: string;
  };
}

interface Props {
  onBack?: () => void;
}

const BookingHistoryScreen: React.FC<Props> = ({ onBack }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'Ongoing' | 'Completed' | 'Canceled'>('Ongoing');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceCenters, setServiceCenters] = useState<any[]>([]);

  // Load bookings and service centers from API
  useEffect(() => {
    loadServiceCenters();
    loadBookings();
  }, []);

  // Load service centers to match with bookings
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

  // Find service details from service centers based on service_id and service_centre_id
  const findServiceDetails = (serviceId: number | string | undefined, serviceCentreId: number | string | undefined) => {
    if (!serviceId || !serviceCentreId || !serviceCenters.length) {
      return null;
    }

    const center = serviceCenters.find(
      (sc: any) => sc.id === Number(serviceCentreId) || String(sc.id) === String(serviceCentreId)
    );

    if (!center || !center.services_offered || !Array.isArray(center.services_offered)) {
      return null;
    }

    const service = center.services_offered.find(
      (s: any) => s.id === Number(serviceId) || String(s.id) === String(serviceId)
    );

    return service || null;
  };

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // 1) Cache first for fast list display
      const cached = await authService.getBookingList(false);
      if (cached.success && cached.bookings?.length) {
        setBookings(Array.isArray(cached.bookings) ? cached.bookings : []);
        setIsLoading(false);
      }
      // 2) Refresh in background for latest data
      const result = await authService.getBookingList(true);
      if (result.success && result.bookings) {
        setBookings(Array.isArray(result.bookings) ? result.bookings : []);
      } else if (!cached.success || !cached.bookings?.length) {
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
    
    // Try to find service details from service centers
    // Check multiple possible field names for service_id
    const serviceId = 
      booking.service_id || 
      booking.service?.id || 
      (booking as any).service_id ||
      (booking as any).serviceId ||
      (booking as any).service?.id;
    
    const serviceCentreId = booking.service_centre_id || (booking as any).service_centre_id || (booking as any).serviceCentreId;
    
    // First try to find from service centers, then use booking data
    let matchedService = findServiceDetails(serviceId, serviceCentreId);
    
    // If not found in service centers but we have service data in booking, use that
    if (!matchedService && booking.service) {
      matchedService = {
        id: booking.service.id,
        name: booking.service.name,
        price: booking.service.price,
        offer_price: booking.service.offer_price
      };
    }
    
    // Update serviceId if we found it from matched service
    const finalServiceId = serviceId || matchedService?.id;
    
    console.log('Service matching:', {
      serviceId,
      serviceCentreId,
      matchedService: matchedService ? { name: matchedService.name, price: matchedService.price, offer_price: matchedService.offer_price } : null,
      serviceCentersCount: serviceCenters.length
    });
    
    // Extract service information - prioritize matched service from service centers
    const serviceName = 
      matchedService?.name ||
      booking.service?.name || 
      booking.service_name || 
      (booking as any).service_name ||
      booking.service_type || 
      'Car Wash Service';
    
    const servicePrice = 
      matchedService?.price ||
      booking.service?.price || 
      booking.service_price ||
      (booking as any).service_price;
    
    const serviceOfferPrice = 
      matchedService?.offer_price ||
      booking.service?.offer_price || 
      booking.service_offer_price ||
      (booking as any).service_offer_price;
    
    // Calculate total price (use offer_price if available, otherwise use price)
    let totalPrice = '$25.00'; // Default fallback
    if (serviceOfferPrice) {
      try {
        totalPrice = `$${parseFloat(String(serviceOfferPrice)).toFixed(2)}`;
      } catch (e) {
        console.error('Error parsing offer price:', e);
      }
    } else if (servicePrice) {
      try {
        totalPrice = `$${parseFloat(String(servicePrice)).toFixed(2)}`;
      } catch (e) {
        console.error('Error parsing price:', e);
      }
    }
    
    // Get service center name - try to find from service centers list
    let centerName = booking.service_centre?.name || `Service Center ${booking.service_centre_id}`;
    let centerAddress = booking.service_centre?.address || `Service Center ${booking.service_centre_id} Location`;
    
    if (serviceCenters.length > 0) {
      const center = serviceCenters.find(
        (sc: any) => sc.id === Number(serviceCentreId) || String(sc.id) === String(serviceCentreId)
      );
      if (center) {
        centerName = center.name || centerName;
        centerAddress = center.address || centerAddress;
      }
    }
    
    const displayData = {
      id: booking.booking_id || booking.id.toString(),
      name: centerName,
      serviceName: serviceName,
      type: booking.service_type || 'Car Wash',
      date: formatDate(booking.booking_date),
      time: formatTime(booking.booking_time),
      dateTime: formatDateTimeRange(booking.booking_date, booking.booking_time),
      status: mapBookingStatus(booking.status),
      total: totalPrice,
      servicePrice: servicePrice ? String(servicePrice) : undefined,
      serviceOfferPrice: serviceOfferPrice ? String(serviceOfferPrice) : undefined,
      serviceId: finalServiceId ? String(finalServiceId) : undefined,
      vehicle_no: booking.vehicle_no,
      carmodel: booking.carmodel || '',
      notes: booking.notes,
      address: centerAddress,
      duration: getDuration(booking.booking_date, booking.booking_time),
    };
    
    console.log('Display data:', JSON.stringify(displayData, null, 2));
    return displayData;
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
      
      return timeRange ? `${day} ${month} ${year} ${timeRange}` : `${day} ${month} ${year}`;
    } catch (error) {
      return '';
    }
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

  // Sort bookings by created_at date/time (most recent first)
  const allBookingDisplayData = ([...(bookings || [])]
    .sort((a, b) => {
      // Prioritize created_at, then createdAt, then updated_at, then booking_date/booking_time
      const dateA = new Date(a.created_at || a.createdAt || a.updated_at || 0).getTime();
      const dateB = new Date(b.created_at || b.createdAt || b.updated_at || 0).getTime();
      
      // If created_at dates are valid, use them
      if (dateA > 0 && dateB > 0) {
        return dateB - dateA; // Most recent first
      }
      
      // Fallback to booking_date/booking_time if created_at is not available
      try {
        let datePartA = (a.booking_date || '').trim();
        let timePartA = (a.booking_time || '00:00:00').trim();
        let datePartB = (b.booking_date || '').trim();
        let timePartB = (b.booking_time || '00:00:00').trim();

        // Handle common non-ISO formats
        const dmYMatchA = datePartA.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
        if (dmYMatchA) {
          const d = dmYMatchA[1].padStart(2, '0');
          const m = dmYMatchA[2].padStart(2, '0');
          const y = dmYMatchA[3];
          datePartA = `${y}-${m}-${d}`;
        }
        const dmYMatchB = datePartB.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
        if (dmYMatchB) {
          const d = dmYMatchB[1].padStart(2, '0');
          const m = dmYMatchB[2].padStart(2, '0');
          const y = dmYMatchB[3];
          datePartB = `${y}-${m}-${d}`;
        }

        // If time is HH:MM, add :00 seconds
        if (/^\d{1,2}:\d{2}$/.test(timePartA)) {
          timePartA = `${timePartA}:00`;
        }
        if (/^\d{1,2}:\d{2}$/.test(timePartB)) {
          timePartB = `${timePartB}:00`;
        }

        const tsA = Date.parse(`${datePartA}T${timePartA}`);
        const tsB = Date.parse(`${datePartB}T${timePartB}`);
        if (!Number.isNaN(tsA) && !Number.isNaN(tsB)) {
          return tsB - tsA;
        }
      } catch (e) {
        // ignore
      }
      
      // Final fallback: use 0 for invalid dates
      return dateB - dateA;
    }))
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom', 'left', 'right']}>
      <View style={[
        styles.header, 
        { 
          backgroundColor: colors.background, 
          borderBottomColor: colors.border,
          paddingTop: (insets?.top ?? 0) + 4,
        }
      ]}>
        <View style={styles.headerLeftPlaceholder} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[styles.title, { color: colors.text }]}>Booking History</Text>
        </View>
        <TouchableOpacity onPress={loadBookings} style={styles.refreshButton} activeOpacity={0.7}>
          <Ionicons name="refresh" size={Platform.select({ ios: 24, android: 22 })} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.tabsContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Ongoing' && [styles.activeTab, { borderBottomColor: BLUE_COLOR }]]}
          onPress={() => setActiveTab('Ongoing')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'Ongoing' ? [styles.activeTabText, { color: BLUE_COLOR }] : { color: colors.textSecondary }]}>
            Ongoing
          </Text>
          {ongoingCount > 0 && (
            <View style={[styles.tabBadge, { backgroundColor: activeTab === 'Ongoing' ? BLUE_COLOR : '#E5E7EB' }]}>
              <Text style={[styles.tabBadgeText, { color: activeTab === 'Ongoing' ? '#FFFFFF' : '#6B7280' }]}>{ongoingCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Completed' && [styles.activeTab, { borderBottomColor: BLUE_COLOR }]]}
          onPress={() => setActiveTab('Completed')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'Completed' ? [styles.activeTabText, { color: BLUE_COLOR }] : { color: colors.textSecondary }]}>
            Completed
          </Text>
          {completedCount > 0 && (
            <View style={[styles.tabBadge, { backgroundColor: activeTab === 'Completed' ? BLUE_COLOR : '#E5E7EB' }]}>
              <Text style={[styles.tabBadgeText, { color: activeTab === 'Completed' ? '#FFFFFF' : '#6B7280' }]}>{completedCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Canceled' && [styles.activeTab, { borderBottomColor: BLUE_COLOR }]]}
          onPress={() => setActiveTab('Canceled')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'Canceled' ? [styles.activeTabText, { color: BLUE_COLOR }] : { color: colors.textSecondary }]}>
            Canceled
          </Text>
          {canceledCount > 0 && (
            <View style={[styles.tabBadge, { backgroundColor: activeTab === 'Canceled' ? BLUE_COLOR : '#E5E7EB' }]}>
              <Text style={[styles.tabBadgeText, { color: activeTab === 'Canceled' ? '#FFFFFF' : '#6B7280' }]}>{canceledCount}</Text>
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
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading your bookings…</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.text }]}>Failed to load bookings</Text>
            <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>{error}</Text>
            <TouchableOpacity style={[styles.retryButton, { backgroundColor: BLUE_COLOR }]} onPress={loadBookings}>
              <Text style={[styles.retryButtonText, { color: '#FFFFFF' }]}>Try Again</Text>
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
                <Text style={styles.serviceName}>{booking.name}</Text>
                
                {/* Service Name */}
                {booking.serviceName && (
                  <View style={styles.serviceNameRow}>
                    <Ionicons name="water-outline" size={16} color={BLUE_COLOR} />
                    <Text style={[styles.serviceNameText, { color: colors.text }]}>{booking.serviceName}</Text>
                  </View>
                )}
                
                {/* Date/Time in Pill - Different colors based on status */}
                <View style={[
                  styles.dateTimePill, 
                  booking.status === 'Completed' 
                    ? { backgroundColor: '#E8F5E9' }
                    : booking.status === 'In Progress'
                    ? { backgroundColor: 'rgba(3, 88, 168, 0.1)' }
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
                        ? BLUE_COLOR
                        : booking.status === 'Canceled'
                        ? '#6B7280'
                        : BLUE_COLOR
                    } 
                  />
                  <Text style={styles.dateTimeText}>{booking.dateTime}</Text>
                </View>
                
                {/* Vehicle Number */}
                <View style={styles.infoRow}>
                  <Ionicons name="car-outline" size={14} color={BLUE_COLOR} />
                  <Text style={styles.infoText}>
                    Vehicle: {booking.vehicle_no}
                  </Text>
                </View>
                
                {/* Car Model */}
                {booking.carmodel && (
                  <View style={styles.infoRow}>
                    <Ionicons name="car-sport-outline" size={14} color={BLUE_COLOR} />
                    <Text style={styles.infoText}>
                      Model: {booking.carmodel}
                    </Text>
                  </View>
                )}
                
                {/* Booking ID */}
                <View style={styles.infoRow}>
                  <Ionicons name="receipt-outline" size={14} color={BLUE_COLOR} />
                  <Text style={styles.infoTextBold}>
                    Booking No: {booking.id}
                  </Text>
                </View>
                
                {/* Service ID */}
                {booking.serviceId && (
                  <View style={styles.infoRow}>
                    <Ionicons name="pricetag-outline" size={14} color={BLUE_COLOR} />
                    <Text style={[styles.serviceIdText, { color: colors.textSecondary }]}>
                      Service ID: {booking.serviceId}
                    </Text>
                  </View>
                )}
              </View>
              
              {/* Separator */}
              <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />
              
              {/* Footer */}
              <View style={styles.cardFooter}>
                <View style={styles.totalSection}>
                  <Text style={[styles.cardTotalLabel, { color: colors.textSecondary }]}>Total Amount</Text>
                  <View style={styles.priceRow}>
                    {booking.serviceOfferPrice && booking.servicePrice && 
                     parseFloat(String(booking.serviceOfferPrice)) < parseFloat(String(booking.servicePrice)) ? (
                      <>
                        <Text style={styles.cardTotalPrice}>{booking.total}</Text>
                        <Text style={[styles.originalPrice, { color: colors.textSecondary }]}>
                          ${parseFloat(String(booking.servicePrice)).toFixed(2)}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.cardTotalPrice}>{booking.total}</Text>
                    )}
                  </View>
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
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(6),
    paddingTop: moderateScale(14),
    borderBottomWidth: 1,
    minHeight: Platform.select({ ios: 50, android: 48 }),
  },
  headerLeftPlaceholder: {
    width: moderateScale(36),
    height: moderateScale(36),
  },
  backButton: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    ...TEXT_STYLES.screenTitleSmall,
    letterSpacing: -0.3,
    textAlign: 'center',
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: LIST_PADDING_H,
    paddingTop: moderateScale(4),
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: moderateScale(12),
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  activeTab: {},
  tabText: {
    ...TEXT_STYLES.bodyPrimary,
  },
  activeTabText: {
    ...TEXT_STYLES.sectionHeading,
  },
  tabBadge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tabBadgeText: {
    ...TEXT_STYLES.label,
    color: '#FFFFFF',
  },
  bookingsList: {
    flex: 1,
  },
  bookingsListContent: {
    paddingHorizontal: LIST_PADDING_H,
    paddingTop: LIST_PADDING_TOP,
    paddingBottom: LIST_PADDING_BOTTOM,
    flexGrow: 1,
  },
  bookingCard: {
    borderRadius: CARD_RADIUS,
    marginBottom: CARD_MARGIN_BOTTOM,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  statusHeaderBar: {
    backgroundColor: BLUE_COLOR,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: CARD_HEADER_PADDING_H,
    paddingVertical: CARD_HEADER_PADDING_V,
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
  },
  statusHeaderBarCompleted: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: CARD_HEADER_PADDING_H,
    paddingVertical: CARD_HEADER_PADDING_V,
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
  },
  statusHeaderBarCanceled: {
    backgroundColor: '#6B7280',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: CARD_HEADER_PADDING_H,
    paddingVertical: CARD_HEADER_PADDING_V,
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
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
    ...TEXT_STYLES.label,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  statusHeaderTextCompleted: {
    ...TEXT_STYLES.label,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  statusHeaderTextCanceled: {
    ...TEXT_STYLES.label,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  cardContent: {
    padding: CARD_PADDING,
  },
  serviceName: {
    ...TEXT_STYLES.sectionHeading,
    fontSize: FONT_SIZES.SECTION_HEADING_LARGE,
    marginBottom: 8,
    color: BLUE_COLOR,
  },
  serviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  serviceNameText: {
    ...TEXT_STYLES.cardTitle,
    flex: 1,
  },
  serviceType: {
    ...TEXT_STYLES.bodyPrimary,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  locationText: {
    ...TEXT_STYLES.bodyPrimary,
    flex: 1,
  },
  dateTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  dateTimeText: {
    ...TEXT_STYLES.bodySecondaryLarge,
    color: '#6B7280',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  infoText: {
    ...TEXT_STYLES.bodySecondaryLarge,
    color: '#6B7280',
  },
  infoTextBold: {
    ...TEXT_STYLES.cardTitleSemiBold,
    color: '#111827',
  },
  serviceIdText: {
    ...TEXT_STYLES.bodySecondaryLarge,
    color: '#6B7280',
  },
  cardDivider: {
    height: 1,
    marginHorizontal: CARD_HEADER_PADDING_H,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: CARD_PADDING,
    paddingTop: moderateScale(10),
  },
  totalSection: {
    flex: 1,
  },
  cardTotalLabel: {
    ...TEXT_STYLES.bodySecondaryLarge,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTotalPrice: {
    ...TEXT_STYLES.sectionHeading,
    fontSize: FONT_SIZES.SECTION_HEADING_LARGE,
    fontWeight: '700',
    fontFamily: FONTS.INTER_BOLD,
    color: '#10B981',
  },
  originalPrice: {
    ...TEXT_STYLES.bodySecondaryLarge,
    textDecorationLine: 'line-through',
  },
  cancelButtonFooter: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(10),
    borderRadius: 20,
    minHeight: BUTTON_MIN_HEIGHT,
    justifyContent: 'center',
  },
  cancelButtonFooterText: {
    ...TEXT_STYLES.buttonProduction,
    color: '#DC2626',
  },
  noBookingsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  noBookingsText: {
    ...TEXT_STYLES.sectionHeadingMedium,
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
  },
  noBookingsSubtext: {
    ...TEXT_STYLES.bodyPrimary,
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
    ...TEXT_STYLES.bodyPrimary,
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
    ...TEXT_STYLES.sectionHeading,
    color: '#DC2626',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtext: {
    ...TEXT_STYLES.bodySecondaryLarge,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: BLUE_COLOR,
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(12),
    borderRadius: 8,
    minHeight: BUTTON_MIN_HEIGHT,
    justifyContent: 'center',
    shadowColor: BLUE_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  retryButtonText: {
    ...TEXT_STYLES.buttonProduction,
    color: '#FFFFFF',
  },
});

export default BookingHistoryScreen;
