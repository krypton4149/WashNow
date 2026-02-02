import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../../services/authService';
import apiClient from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { platformEdges } from '../../utils/responsive';
import { FONTS, FONT_SIZES, TEXT_STYLES } from '../../utils/fonts';

const BLUE_COLOR = '#0358a8';

interface OwnerRequestsScreenProps {
  onBack?: () => void;
}

type StatusTone = 'pending' | 'accepted' | 'declined';

interface BookingRequestCard {
  id: string;
  customerName: string;
  timeAgo: string;
  status: StatusTone;
  vehicle: {
    model: string;
    plate: string;
    primary: string;
    secondary: string;
    carmodel?: string;
  };
  location: {
    address: string;
    distance: string;
  };
  scheduled: string;
  service: string;
  notes?: string;
  amount: string;
}

const BOOKINGS_CACHE_KEY = 'owner_booking_requests_cache_v1';
const BOOKINGS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const ensureString = (fallback: string, ...candidates: any[]): string => {
  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null) {
      continue;
    }
    const value = String(candidate).trim();
    if (!value || value.toLowerCase() === 'null' || value.toLowerCase() === 'undefined') {
      continue;
    }
    return value;
  }
  return fallback;
};

const ensureNumber = (fallback: number, ...candidates: any[]): number => {
  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate;
    }
    if (typeof candidate === 'string') {
      const parsed = Number(candidate);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }
  return fallback;
};

const normalizeStatus = (status: string | undefined | null): StatusTone => {
  const value = String(status ?? '').trim().toLowerCase();
  if (['accepted', 'approved', 'confirmed', 'completed', 'success', 'done'].includes(value)) {
    return 'accepted';
  }
  if (['declined', 'rejected', 'cancelled', 'canceled', 'failed'].includes(value)) {
    return 'declined';
  }
  return 'pending';
};

const formatRelativeTime = (input: any): string => {
  const candidate = ensureString('', input);
  if (!candidate) {
    return 'Just now';
  }

  const parsed = new Date(candidate);
  if (Number.isNaN(parsed.getTime())) {
    return candidate;
  }

  const diffMs = Date.now() - parsed.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes <= 0) {
    return 'Just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} min${diffMinutes === 1 ? '' : 's'} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hr${diffHours === 1 ? '' : 's'} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) {
    return `${diffWeeks} wk${diffWeeks === 1 ? '' : 's'} ago`;
  }

  return parsed.toLocaleDateString();
};

// Format date and time for display: "24 Jan 2026 09AM-09:30AM"
const formatScheduled = (booking: any): string => {
  const dateCandidate = ensureString('',
    booking?.scheduledAt,
    booking?.scheduled_at,
    booking?.bookingDate,
    booking?.booking_date,
    booking?.service_date,
    booking?.date
  );
  const timeCandidate = ensureString('',
    booking?.booking_time,
    booking?.bookingTime,
    booking?.slot_time,
    booking?.time_slot,
    booking?.time
  );

  if (!dateCandidate) {
    return 'Not scheduled';
  }

  try {
    // Format date: "24 Jan 2026"
    const date = new Date(dateCandidate);
    if (Number.isNaN(date.getTime())) {
      return 'Not scheduled';
    }
    
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    
    // Format time: "09AM-09:30AM"
    let timeRange = '';
    if (timeCandidate) {
      try {
        // Handle time format like "09:00:00" or "09:00"
        const [hours, minutes] = timeCandidate.split(':');
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
        const hour = parseInt(timeCandidate.split(':')[0]);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        timeRange = `${displayHour.toString().padStart(2, '0')}${ampm}`;
      }
    }
    
    return timeRange ? `${day} ${month} ${year}, ${timeRange}` : `${day} ${month} ${year}`;
  } catch (error) {
    return 'Not scheduled';
  }
};

const formatAmount = (booking: any): string => {
  const formatted = ensureString('',
    booking?.amount_display,
    booking?.amountDisplay,
    booking?.amount_formatted,
    booking?.total_amount_formatted,
    booking?.payable_amount_formatted
  );
  if (formatted) {
    return formatted;
  }

  const amount = ensureNumber(Number.NaN,
    booking?.total_amount,
    booking?.totalAmount,
    booking?.amount,
    booking?.payable_amount,
    booking?.price
  );

  if (Number.isNaN(amount)) {
    return '--';
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  } catch {
    return `£${amount.toFixed(2)}`;
  }
};

const mapBookingToCard = (booking: any, index: number): BookingRequestCard => {
  const id = ensureString(`booking-${index}`,
    booking?.booking_id,
    booking?.bookingId,
    booking?.id,
    booking?.reference,
    booking?.uuid
  );

  const customerName = ensureString('Unknown Customer',
    booking?.customerName,
    booking?.customer_name,
    booking?.customer?.name,
    booking?.user?.name,
    booking?.client?.name,
    booking?.visitor?.name,
    booking?.visitor_name
  );

  const vehiclePlate = ensureString('Plate not provided',
    booking?.vehiclePlate,
    booking?.vehicle_plate,
    booking?.vehicle?.plate,
    booking?.car_plate,
    booking?.car?.plate,
    booking?.vehicle_no
  );

  const vehicleModel = ensureString('',
    booking?.carmodel,
    booking?.car_model,
    booking?.vehicleModel,
    booking?.vehicle_model,
    booking?.vehicle?.model,
    booking?.car?.model,
    booking?.vehicleType,
    booking?.vehicle_type,
    booking?.vehicleCategory,
    booking?.vehicle_category
  );

  const locationAddress = ensureString('Address not provided',
    booking?.address,
    booking?.customer_address,
    booking?.service_address,
    booking?.location?.address,
    booking?.pickup_address
  );

  const locationDistance = ensureString('',
    booking?.distanceText,
    booking?.distance,
    booking?.location?.distance
  );

  const notes = ensureString('',
    booking?.notes,
    booking?.special_request,
    booking?.special_requests,
    booking?.customer_notes,
    booking?.instructions
  );

  const status = normalizeStatus(ensureString('pending',
    booking?.status,
    booking?.booking_status,
    booking?.state,
    booking?.approval_status
  ));

  const timeAgo = formatRelativeTime(
    booking?.created_at ||
    booking?.createdAt ||
    booking?.requested_at ||
    booking?.updated_at
  );

  return {
    id,
    customerName,
    timeAgo,
    status,
    vehicle: {
      primary: vehiclePlate !== 'Plate not provided' ? vehiclePlate : (vehicleModel || 'Vehicle not specified'),
      secondary: vehicleModel && vehiclePlate !== 'Plate not provided' ? vehicleModel : '',
      carmodel: vehicleModel || undefined,
    },
    location: {
      address: locationAddress,
      distance: locationDistance,
    },
    scheduled: formatScheduled(booking),
    service: ensureString('Car Wash',
      booking?.serviceName,
      booking?.service_name,
      booking?.service?.name,
      booking?.package?.name,
      booking?.service,
      booking?.service_type,
      booking?.serviceType
    ),
    notes: notes || undefined,
    amount: formatAmount(booking),
  };
};

const getBookingTimestamp = (booking: any): number => {
  const ensureDateString = (...values: any[]): string => ensureString('', ...values);
  const dateCandidates = [
    ensureDateString(
      booking?.scheduled_at,
      booking?.scheduledAt,
      booking?.booking_date,
      booking?.bookingDate,
      booking?.service_date,
      booking?.date,
    ),
  ];

  const timeCandidates = [
    ensureDateString(
      booking?.booking_time,
      booking?.bookingTime,
      booking?.slot_time,
      booking?.time_slot,
      booking?.time,
    ),
  ];

  const parseWithTime = (dateValue: string, timeValue?: string): number => {
    if (!dateValue) {
      return Number.NaN;
    }
    let candidate = dateValue;
    if (timeValue && !dateValue.includes('T')) {
      candidate = `${dateValue} ${timeValue}`;
    }
    const parsed = new Date(candidate);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.getTime();
    }

    // Attempt fallback by constructing ISO string manually
    if (timeValue) {
      const isoCandidate = `${dateValue}T${timeValue}`;
      const parsedIso = new Date(isoCandidate);
      if (!Number.isNaN(parsedIso.getTime())) {
        return parsedIso.getTime();
      }
    }

    return Number.NaN;
  };

  for (const dateValue of dateCandidates) {
    if (!dateValue) {
      continue;
    }
    const timestamp = parseWithTime(dateValue, timeCandidates[0]);
    if (!Number.isNaN(timestamp)) {
      return timestamp;
    }
  }

  const fallbackDate = ensureDateString(
    booking?.created_at,
    booking?.createdAt,
    booking?.updated_at,
    booking?.requested_at,
  );
  const fallbackParsed = new Date(fallbackDate);
  if (!Number.isNaN(fallbackParsed.getTime())) {
    return fallbackParsed.getTime();
  }

  return Number.NEGATIVE_INFINITY;
};

const extractBookingArray = (payload: any): any[] => {
  if (!payload) {
    return [];
  }

  const visited = new Set<any>();
  const priorityKeys = [
    'bookings',
    'requests',
    'data',
    'items',
    'results',
    'list',
    'rows',
    'records',
  ];

  const helper = (value: any): any[] => {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value !== 'object') {
      return [];
    }

    if (visited.has(value)) {
      return [];
    }
    visited.add(value);

    for (const key of priorityKeys) {
      const candidate = (value as Record<string, any>)[key];
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }

    for (const key of priorityKeys) {
      const candidate = (value as Record<string, any>)[key];
      if (candidate && typeof candidate === 'object') {
        const result = helper(candidate);
        if (result.length > 0) {
          return result;
        }
      }
    }

    for (const candidate of Object.values(value as Record<string, any>)) {
      if (candidate && typeof candidate === 'object') {
        const result = helper(candidate);
        if (result.length > 0) {
          return result;
        }
      } else if (Array.isArray(candidate)) {
        return candidate;
      }
    }

    return [];
  };

  return helper(payload);
};

const OwnerRequestsScreen: React.FC<OwnerRequestsScreenProps> = ({
  onBack,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [rawBookings, setRawBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cancellationLoading, setCancellationLoading] = useState<Record<string, boolean>>({});
  const hasHydratedCacheRef = useRef<boolean>(false);

  const loadCachedBookings = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(BOOKINGS_CACHE_KEY);
      if (!cached) {
        return;
      }
      const parsed = JSON.parse(cached);
      if (!parsed || !Array.isArray(parsed.data)) {
        return;
      }

      setRawBookings(parsed.data);
      hasHydratedCacheRef.current = true;
      setIsLoading(false);
    } catch (cacheError) {
      console.error('[OwnerRequestsScreen] failed to load cached bookings', cacheError);
    }
  }, []);

  const fetchBookings = useCallback(async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        if (!hasHydratedCacheRef.current) {
          setIsLoading(true);
        }
      }
      setError(null);

      // Use the proper authService method for owner bookings
      const result = await authService.getOwnerBookings(isRefresh);

      if (result.success && result.bookings) {
        // Sort bookings by created_at date (most recent first)
        const sortedBookings = [...result.bookings].sort((a, b) => {
          const dateA = new Date(a.created_at || a.createdAt || a.requested_at || 0).getTime();
          const dateB = new Date(b.created_at || b.createdAt || b.requested_at || 0).getTime();
          return dateB - dateA; // Most recent first
        });

        console.log('[OwnerRequestsScreen] bookings loaded and sorted', {
          count: sortedBookings.length,
          sample: sortedBookings.slice(0, 2),
        });

        setRawBookings(sortedBookings);
        setCancellationLoading({});
        hasHydratedCacheRef.current = true;
        
        // Cache the sorted bookings
        try {
          await AsyncStorage.setItem(BOOKINGS_CACHE_KEY, JSON.stringify({
            timestamp: Date.now(),
            data: sortedBookings,
          }));
        } catch (cacheError) {
          console.error('[OwnerRequestsScreen] failed to cache bookings', cacheError);
        }
      } else {
        // If no bookings or error, still try to use cached data if available
        const cached = await AsyncStorage.getItem(BOOKINGS_CACHE_KEY);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed?.data && Array.isArray(parsed.data) && parsed.data.length > 0) {
              // Sort cached bookings by created_at
              const sortedCached = [...parsed.data].sort((a: any, b: any) => {
                const dateA = new Date(a.created_at || a.createdAt || a.requested_at || 0).getTime();
                const dateB = new Date(b.created_at || b.createdAt || b.requested_at || 0).getTime();
                return dateB - dateA;
              });
              setRawBookings(sortedCached);
              hasHydratedCacheRef.current = true;
              // Don't show error if we have cached data - silently use cache
              setError(null);
              return; // Exit early if we have cached data
            }
          } catch (cacheError) {
            console.error('[OwnerRequestsScreen] failed to parse cached bookings', cacheError);
          }
        }
        
        // Only show error if we don't have cached data AND result was not successful
        // If result.success is false but we have bookings (from cache), don't show error
        if (!result.success && (!result.bookings || result.bookings.length === 0)) {
          // Check if error is timeout - if so, try to use cached data silently
          const isTimeout = result.error?.toLowerCase().includes('timeout');
          if (isTimeout && cached) {
            // Timeout occurred but we have cache - use it silently
            setError(null);
          } else {
            setError(result.error || 'Failed to load booking requests. Please try again.');
          }
        } else if (result.bookings && result.bookings.length > 0) {
          // We have bookings (likely from cache) - clear any error
          setError(null);
        }
      }
    } catch (fetchError: any) {
      console.error('[OwnerRequestsScreen] failed to load bookings', {
        message: fetchError?.message,
        error: fetchError,
      });

      // Try to load from cache on error
      try {
        const cached = await AsyncStorage.getItem(BOOKINGS_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.data && Array.isArray(parsed.data)) {
            // Sort cached bookings by created_at
            const sortedCached = [...parsed.data].sort((a: any, b: any) => {
              const dateA = new Date(a.created_at || a.createdAt || a.requested_at || 0).getTime();
              const dateB = new Date(b.created_at || b.createdAt || b.requested_at || 0).getTime();
              return dateB - dateA;
            });
            setRawBookings(sortedCached);
            hasHydratedCacheRef.current = true;
            setError(null); // Clear error if we have cached data
          }
        }
      } catch (cacheError) {
        console.error('[OwnerRequestsScreen] failed to load from cache', cacheError);
      }

      // Handle 401 Unauthorized errors specifically
      if (fetchError?.status === 401 || fetchError?.response?.status === 401 || fetchError?.message === 'Unauthorized') {
        const errorMessage = 'Your session has expired. Please log in again.';
        setError(errorMessage);
        // Clear token and user data on unauthorized
        try {
          await authService.removeToken();
          await authService.removeUser();
        } catch (clearError) {
          console.error('[OwnerRequestsScreen] failed to clear auth data', clearError);
        }
      } else {
        // Check if it's a timeout error and we have cached data
        const isTimeout = fetchError?.message?.toLowerCase().includes('timeout');
        if (isTimeout && hasHydratedCacheRef.current) {
          // Timeout occurred but we have cached data - don't show error
          setError(null);
        } else if (!hasHydratedCacheRef.current) {
          setError(fetchError?.message || 'Failed to load booking requests. Please check your internet connection and try again.');
        }
      }
      
      if (!hasHydratedCacheRef.current) {
        setRawBookings([]);
      }
      setCancellationLoading({});
    } finally {
      if (isRefresh) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const hydrateAndFetch = async () => {
      await loadCachedBookings();

      if (!isMounted) {
        return;
      }

      // Determine if cache is stale
      try {
        const cached = await AsyncStorage.getItem(BOOKINGS_CACHE_KEY);
        let forceLoading = true;
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.timestamp && Date.now() - parsed.timestamp < BOOKINGS_CACHE_DURATION) {
            forceLoading = false;
          }
        }
        if (forceLoading) {
          hasHydratedCacheRef.current = false;
        }
      } catch {
        hasHydratedCacheRef.current = false;
      }

      await fetchBookings();
    };

    hydrateAndFetch();

    return () => {
      isMounted = false;
    };
  }, [fetchBookings, loadCachedBookings]);

  const requests = useMemo<BookingRequestCard[]>(() => {
    // Sort bookings by created_at date (most recent first)
    const sorted = [...rawBookings].sort((a, b) => {
      // Prioritize created_at, then createdAt, then requested_at, then booking timestamp
      const dateA = new Date(a.created_at || a.createdAt || a.requested_at || 0).getTime();
      const dateB = new Date(b.created_at || b.createdAt || b.requested_at || 0).getTime();
      
      // If dates are valid, use them; otherwise fall back to booking timestamp
      if (dateA > 0 && dateB > 0) {
        return dateB - dateA; // Most recent first
      }
      
      // Fallback to booking timestamp
      const tsA = getBookingTimestamp(a);
      const tsB = getBookingTimestamp(b);
      return tsB - tsA;
    });
    return sorted.map(mapBookingToCard);
  }, [rawBookings]);

  const setBookingActionLoading = useCallback((bookingId: string, loading: boolean) => {
    setCancellationLoading((prev) => ({
      ...prev,
      [bookingId]: loading,
    }));
  }, []);

  const handleCancelBooking = useCallback((bookingId: string) => {
    if (!bookingId) {
      return;
    }

    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setBookingActionLoading(bookingId, true);
            try {
              const result = await authService.cancelOwnerBooking(bookingId);
              if (!result.success) {
                Alert.alert('Error', result.error || 'Failed to cancel booking.');
                return;
              }
              Alert.alert('Success', result.message || 'Booking cancelled successfully.');
              await fetchBookings(true);
            } catch (cancelError: any) {
              Alert.alert('Error', cancelError?.message || 'Failed to cancel booking.');
            } finally {
              setBookingActionLoading(bookingId, false);
            }
          },
        },
      ],
    );
  }, [fetchBookings, setBookingActionLoading]);

  // Placeholder to keep hook count stable after removing Accept (bookings are already confirmed)
  useCallback((_bookingId: string) => {}, []);

  const getStatusStyles = (status: StatusTone) => {
    if (status === 'accepted') {
      return { bg: '#DCFCE7', text: '#16A34A', label: 'Accepted' };
    }
    if (status === 'declined') {
      return { bg: '#FEE2E2', text: '#DC2626', label: 'Declined' };
    }
    return { bg: '#FEF3C7', text: '#F97316', label: 'Pending' };
  };

  const pendingCount = useMemo(() => {
    return requests.filter((request) => request.status === 'pending').length;
  }, [requests]);

  const headerSubtitle = useMemo(() => {
    if (isLoading) {
      return 'Loading requests...';
    }
    if (error) {
      return 'Unable to load requests';
    }
    if (requests.length === 0) {
      return 'No booking requests yet';
    }
    if (pendingCount === requests.length) {
      return `${pendingCount} pending request${pendingCount === 1 ? '' : 's'}`;
    }
    return `${pendingCount} pending · ${requests.length} total`;
  }, [isLoading, error, requests, pendingCount]);

  const handleRefresh = useCallback(() => {
    fetchBookings(true);
  }, [fetchBookings]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom', 'left', 'right']}>
      {/* Header */}
      <View style={[
        styles.header, 
        { 
          backgroundColor: colors.background, 
          borderBottomColor: colors.border,
          paddingTop: Platform.select({ ios: 0.5, android: 0.5 }),
        }
      ]}>
        <View style={styles.placeholder} />
        <View style={styles.headerTextGroup}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">New Requests</Text>
          <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
        </View>
        <TouchableOpacity 
          onPress={handleRefresh} 
          style={styles.reloadButton} 
          activeOpacity={0.7}
          disabled={isRefreshing}
        >
          <Ionicons 
            name="refresh" 
            size={Platform.select({ ios: 24, android: 22 })} 
            color={isRefreshing ? colors.textSecondary : colors.text} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.text}
            colors={[colors.text]}
          />
        }
      >
        {isLoading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="small" color={colors.text} />
            <Text style={[styles.stateDescription, { color: colors.textSecondary }]}>Loading booking requests...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateContainer}>
            <Ionicons name="alert-circle-outline" size={34} color={colors.error} style={styles.stateIcon} />
            <Text style={[styles.stateTitle, { color: colors.text }]}>Unable to load bookings</Text>
            <Text style={[styles.stateDescription, { color: colors.textSecondary }]}>{error}</Text>
            <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.button }]} activeOpacity={0.85} onPress={() => fetchBookings()}>
              <Ionicons name="refresh" size={16} color={colors.buttonText} />
              <Text style={[styles.retryButtonText, { color: colors.buttonText }]}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.stateContainer}>
            <Ionicons name="car-outline" size={38} color={colors.textSecondary} style={styles.stateIcon} />
            <Text style={[styles.stateTitle, { color: colors.text }]}>No booking requests yet</Text>
            <Text style={[styles.stateDescription, { color: colors.textSecondary }]}>
              New booking requests from customers will appear here.
            </Text>
          </View>
        ) : (
        <View style={styles.requestsList}>
          {requests.map((request) => {
            const statusStyles = getStatusStyles(request.status);
            return (
              <View key={request.id} style={[styles.requestCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{request.customerName}</Text>
                    <Text style={styles.timeAgo}>{request.timeAgo}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyles.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: statusStyles.text }]}>
                      {statusStyles.label}
                    </Text>
                  </View>
                </View>

                {/* Vehicle Information */}
                <View style={styles.vehicleSection}>
                  <View style={styles.vehicleIconContainer}>
                    <Ionicons name="car" size={18} color={BLUE_COLOR} />
                  </View>
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleLabel}>VEHICLE</Text>
                    <Text style={styles.vehicleNumber}>{request.vehicle.primary}</Text>
                    {request.vehicle.carmodel && (
                      <Text style={styles.vehicleModel}>Model: {request.vehicle.carmodel}</Text>
                    )}
                  </View>
                </View>

                {/* Scheduled and Service Pills */}
                <View style={styles.metaRow}>
                  <View style={styles.metaPill}>
                    <View style={styles.metaPillHeader}>
                      <Ionicons name="calendar-outline" size={13} color="#9CA3AF" />
                      <Text style={styles.metaLabel}>SCHEDULED</Text>
                    </View>
                    <Text style={styles.metaValue}>{request.scheduled}</Text>
                  </View>
                  <View style={styles.metaPill}>
                    <View style={styles.metaPillHeader}>
                      <Ionicons name="water-outline" size={13} color={BLUE_COLOR} />
                      <Text style={styles.metaLabel}>SERVICE</Text>
                    </View>
                    <Text style={[styles.metaValue, { color: BLUE_COLOR, fontWeight: '600' }]}>{request.service}</Text>
                  </View>
                </View>

                {/* Customer Notes (if available) */}
                {request.notes && (
                  <View style={styles.notesContainer}>
                    <Text style={styles.notesLabel}>Customer Notes</Text>
                    <Text style={styles.notesValue}>{request.notes}</Text>
                  </View>
                )}

                {/* Footer: Amount and Action Buttons */}
                <View style={styles.footerRow}>
                  <View style={styles.amountSection}>
                    <Text style={styles.amountLabel}>Amount</Text>
                    <Text style={styles.amountValue}>{request.amount}</Text>
                  </View>
                  <View style={styles.footerActions}>
                    {/* One button only: Cancel booking (bookings are already confirmed when user books) */}
                    {(request.status === 'pending' || request.status === 'accepted') && (
                      <TouchableOpacity
                        style={[styles.cancelButton, cancellationLoading[request.id] && styles.buttonDisabled]}
                        disabled={!!cancellationLoading[request.id]}
                        onPress={() => handleCancelBooking(request.id)}
                        activeOpacity={0.7}
                      >
                        {cancellationLoading[request.id] ? (
                          <ActivityIndicator size="small" color="#DC2626" />
                        ) : (
                          <>
                            <Ionicons name="close-circle" size={14} color="#DC2626" />
                            <Text style={styles.cancelButtonText}>Cancel booking</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Platform.select({ ios: 20, android: 16 }),
    paddingBottom: Platform.select({ ios: 4, android: 4 }),
    paddingTop: 0,
    borderBottomWidth: 1,
  },
  backButton: {
    width: Platform.select({ ios: 36, android: 32 }),
    height: Platform.select({ ios: 36, android: 32 }),
    borderRadius: Platform.select({ ios: 18, android: 16 }),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextGroup: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...TEXT_STYLES.screenTitleSmall,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  headerSubtitle: {
    ...TEXT_STYLES.bodySecondary,
    marginTop: Platform.select({ ios: 2, android: 2 }),
    textAlign: 'center',
    color: '#6B7280',
  },
  placeholder: {
    width: 40,
  },
  reloadButton: {
    width: Platform.select({ ios: 36, android: 32 }),
    height: Platform.select({ ios: 36, android: 32 }),
    borderRadius: Platform.select({ ios: 18, android: 16 }),
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Platform.select({ ios: 20, android: 18 }),
    paddingTop: Platform.select({ ios: 16, android: 12 }),
    paddingBottom: Platform.select({ ios: 60, android: 50 }),
  },
  requestsList: {
    gap: 0, // Cards now have their own marginBottom
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    ...TEXT_STYLES.cardTitleSemiBold,
    fontSize: FONT_SIZES.SECTION_HEADING_LARGE,
    color: BLUE_COLOR,
  },
  timeAgo: {
    ...TEXT_STYLES.bodySecondary,
    marginTop: 2,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeText: {
    ...TEXT_STYLES.bodySecondary,
    fontWeight: '500',
    fontFamily: FONTS.INTER_MEDIUM,
    letterSpacing: 0.2,
  },
  vehicleSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  vehicleIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleLabel: {
    ...TEXT_STYLES.caption,
    fontWeight: '500',
    fontFamily: FONTS.INTER_MEDIUM,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  vehicleNumber: {
    ...TEXT_STYLES.cardTitleSemiBold,
    fontSize: FONT_SIZES.SECTION_HEADING_LARGE,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
    color: BLUE_COLOR,
    marginBottom: 0,
  },
  vehicleModel: {
    ...TEXT_STYLES.bodySecondary,
    marginTop: 1,
    color: '#6B7280',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  metaPill: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metaPillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metaLabel: {
    ...TEXT_STYLES.label,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    ...TEXT_STYLES.bodyPrimary,
    marginTop: 2,
    color: '#6B7280',
  },
  notesContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    backgroundColor: '#EFF6FF',
    padding: 10,
    marginBottom: 10,
    gap: 4,
  },
  notesLabel: {
    ...TEXT_STYLES.cardTitleSemiBold,
    fontSize: FONT_SIZES.BODY_PRIMARY,
    color: '#1E40AF',
    marginBottom: 2,
  },
  notesValue: {
    ...TEXT_STYLES.bodyPrimary,
    color: '#1E3A8A',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  amountSection: {
    flex: 1,
  },
  amountLabel: {
    ...TEXT_STYLES.label,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  amountValue: {
    ...TEXT_STYLES.sectionHeading,
    fontSize: FONT_SIZES.SECTION_HEADING_LARGE,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
    color: '#10B981',
  },
  footerActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  declineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: BLUE_COLOR,
    backgroundColor: '#EFF6FF',
    shadowColor: BLUE_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  declineButtonText: {
    ...TEXT_STYLES.buttonProduction,
    color: BLUE_COLOR,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  acceptButtonText: {
    ...TEXT_STYLES.buttonProduction,
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    backgroundColor: '#FEE2E2',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 36,
  },
  cancelButtonText: {
    ...TEXT_STYLES.buttonProduction,
    fontSize: FONT_SIZES.BUTTON,
    color: '#DC2626',
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  stateIcon: {
    marginBottom: 12,
  },
  stateTitle: {
    ...TEXT_STYLES.sectionHeading,
    color: '#111827',
    textAlign: 'center',
  },
  stateDescription: {
    ...TEXT_STYLES.bodyPrimary,
    marginTop: 6,
    color: '#6B7280',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#111827',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  retryButtonText: {
    ...TEXT_STYLES.buttonProduction,
    color: '#FFFFFF',
  },
});

export default OwnerRequestsScreen;


