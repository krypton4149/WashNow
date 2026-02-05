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
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../../services/authService';
import apiClient from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { platformEdges, moderateScale, verticalScale, iconScale } from '../../utils/responsive';
import { FONTS, FONT_SIZES, TEXT_STYLES } from '../../utils/fonts';

const BLUE_COLOR = '#0358a8';
const LIGHT_GREY_BG = '#F3F4F6';

interface OwnerRequestsScreenProps {
  onBack?: () => void;
  onSessionExpired?: () => void;
}

type StatusTone = 'pending' | 'accepted' | 'declined' | 'completed';

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
  scheduledDate: string;
  scheduledTime: string;
  service: string;
  notes?: string;
  paymentMethod: string;
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
  if (value === 'completed' || value === 'done' || value === 'success') {
    return 'completed';
  }
  if (['accepted', 'approved', 'confirmed'].includes(value)) {
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

const formatScheduledParts = (booking: any): { dateStr: string; timeStr: string } => {
  const full = formatScheduled(booking);
  if (!full || full === 'Not scheduled') {
    return { dateStr: '—', timeStr: '' };
  }
  const commaIdx = full.indexOf(', ');
  if (commaIdx > 0) {
    return { dateStr: full.slice(0, commaIdx), timeStr: full.slice(commaIdx + 2) };
  }
  return { dateStr: full, timeStr: '' };
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

  const scheduledFull = formatScheduled(booking);
  const { dateStr: scheduledDate, timeStr: scheduledTime } = formatScheduledParts(booking);

  const paymentMethod = ensureString('Cash',
    booking?.payment_method,
    booking?.paymentMethod,
    booking?.payment_type,
    booking?.paymentType,
    booking?.payment
  );

  return {
    id,
    customerName,
    timeAgo,
    status,
    vehicle: {
      primary: vehiclePlate !== 'Plate not provided' ? vehiclePlate : (vehicleModel || 'Vehicle not specified'),
      secondary: vehicleModel && vehiclePlate !== 'Plate not provided' ? vehicleModel : '',
      model: vehicleModel,
      plate: vehiclePlate,
      carmodel: vehicleModel || undefined,
    },
    location: {
      address: locationAddress,
      distance: locationDistance,
    },
    scheduled: scheduledFull,
    scheduledDate,
    scheduledTime,
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
    paymentMethod,
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
  onSessionExpired,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [rawBookings, setRawBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cancellationLoading, setCancellationLoading] = useState<Record<string, boolean>>({});
  const [acceptLoading, setAcceptLoading] = useState<Record<string, boolean>>({});
  const [completeLoading, setCompleteLoading] = useState<Record<string, boolean>>({});
  const hasHydratedCacheRef = useRef<boolean>(false);
  type DateFilterKey = 'all' | 'today' | 'last7' | 'last30' | 'date';
  const [dateFilter, setDateFilter] = useState<DateFilterKey>('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);

  const getDateRange = useCallback((key: DateFilterKey, customDate?: Date | null): { start: number; end: number } => {
    const now = customDate || new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
    if (key === 'all') {
      return { start: 0, end: end + 1 };
    }
    if (key === 'today' || key === 'date') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
      return { start, end };
    }
    if (key === 'last7') {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
      return { start, end };
    }
    const d = new Date(now);
    d.setDate(d.getDate() - 29);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
    return { start, end };
  }, []);

  const dateOptions = useMemo(() => {
    const list: { date: Date; label: string; key: string }[] = [];
    const today = new Date();
    for (let i = 0; i < 90; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      list.push({
        date: d,
        label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        key: d.toISOString().slice(0, 10),
      });
    }
    return list;
  }, []);

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
        setAcceptLoading({});
        setCompleteLoading({});
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
    let list = rawBookings;
    if (dateFilter !== 'all') {
      const range = dateFilter === 'date' && selectedDate
        ? getDateRange('date', selectedDate)
        : getDateRange(dateFilter);
      const { start, end } = range;
      list = rawBookings.filter((b: any) => {
        const ts = getBookingTimestamp(b);
        if (Number.isNaN(ts) || ts === Number.NEGATIVE_INFINITY) {
          const fallback = new Date(b.created_at || b.createdAt || b.requested_at || 0).getTime();
          return fallback >= start && fallback <= end;
        }
        return ts >= start && ts <= end;
      });
    }
    const sorted = [...list].sort((a, b) => {
      const dateA = new Date(a.created_at || a.createdAt || a.requested_at || 0).getTime();
      const dateB = new Date(b.created_at || b.createdAt || b.requested_at || 0).getTime();
      if (dateA > 0 && dateB > 0) {
        return dateB - dateA;
      }
      const tsA = getBookingTimestamp(a);
      const tsB = getBookingTimestamp(b);
      return tsB - tsA;
    });
    return sorted.map(mapBookingToCard);
  }, [rawBookings, dateFilter, selectedDate, getDateRange]);

  const setBookingActionLoading = useCallback((bookingId: string, loading: boolean) => {
    setCancellationLoading((prev) => ({
      ...prev,
      [bookingId]: loading,
    }));
  }, []);

  const handleAcceptBooking = useCallback((bookingId: string) => {
    if (!bookingId) return;
    Alert.alert(
      'Accept Booking',
      'Accept this booking request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Accept',
          onPress: async () => {
            setAcceptLoading((prev) => ({ ...prev, [bookingId]: true }));
            try {
              const result = await authService.completeOwnerBooking(bookingId);
              if (!result.success) {
                Alert.alert('Error', result.error || 'Failed to accept booking.');
                return;
              }
              await fetchBookings(true);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to accept booking.');
            } finally {
              setAcceptLoading((prev) => ({ ...prev, [bookingId]: false }));
            }
          },
        },
      ]
    );
  }, [fetchBookings]);

  const handleCompleteBooking = useCallback((bookingId: string) => {
    if (!bookingId) return;
    Alert.alert(
      'Complete Booking',
      'Mark this booking as completed?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Complete',
          onPress: async () => {
            setCompleteLoading((prev) => ({ ...prev, [bookingId]: true }));
            try {
              const result = await authService.completeOwnerBooking(bookingId);
              if (!result.success) {
                Alert.alert('Error', result.error || 'Failed to complete booking.');
                return;
              }
              await fetchBookings(true);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to complete booking.');
            } finally {
              setCompleteLoading((prev) => ({ ...prev, [bookingId]: false }));
            }
          },
        },
      ]
    );
  }, [fetchBookings]);

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

  const getStatusStyles = (status: StatusTone) => {
    if (status === 'completed') {
      return { bg: '#E5E7EB', text: '#4B5563', label: 'Completed', icon: '#4B5563' };
    }
    if (status === 'accepted') {
      return { bg: '#DCFCE7', text: '#16A34A', label: 'Accepted', icon: '#16A34A' };
    }
    if (status === 'declined') {
      return { bg: '#DC2626', text: '#FFFFFF', label: 'Declined', icon: '#FFFFFF' };
    }
    return { bg: '#FEF3C7', text: '#B45309', label: 'Pending', icon: '#B45309' };
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
      {/* Header – reduced top padding so content sits closer to Dynamic Island/notch */}
      <View style={[
        styles.header, 
        { 
          backgroundColor: colors.background, 
          borderBottomColor: colors.border,
          paddingTop: Platform.select({ ios: 4, android: 4 }),
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
            size={iconScale(23)} 
            color={isRefreshing ? colors.textSecondary : colors.text} 
          />
        </TouchableOpacity>
      </View>

      <View style={[styles.filterSection, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.filterLabelRow}>
          <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Filter by date</Text>
          <TouchableOpacity
            style={[styles.calendarIconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setCalendarModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={iconScale(20)} color={BLUE_COLOR} />
          </TouchableOpacity>
        </View>
        <View style={styles.filterRow}>
          {(['all', 'today', 'last7', 'last30'] as const).map((key) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.filterChip,
                { borderColor: colors.border },
                dateFilter === key && !selectedDate ? { backgroundColor: BLUE_COLOR, borderColor: BLUE_COLOR } : { backgroundColor: colors.card },
              ]}
              onPress={() => { setDateFilter(key); setSelectedDate(null); }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: dateFilter === key && !selectedDate ? '#FFF' : colors.text },
                ]}
              >
                {key === 'all' ? 'All' : key === 'today' ? 'Today' : key === 'last7' ? 'Last 7 days' : 'Last 30 days'}
              </Text>
            </TouchableOpacity>
          ))}
          {selectedDate && (
            <TouchableOpacity
              style={[styles.filterChip, { backgroundColor: BLUE_COLOR, borderColor: BLUE_COLOR }]}
              onPress={() => setCalendarModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, { color: '#FFF' }]}>
                {selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Modal
        visible={calendarModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarModalVisible(false)}
      >
        <View style={styles.dateModalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setCalendarModalVisible(false)} />
          <View style={[styles.dateModalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.dateModalTitle, { color: colors.text }]}>Select date</Text>
            <TouchableOpacity
              style={[styles.dateModalAllBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => { setDateFilter('all'); setSelectedDate(null); setCalendarModalVisible(false); }}
            >
              <Text style={[styles.dateModalAllText, { color: colors.text }]}>All dates</Text>
            </TouchableOpacity>
            <Text style={[styles.dateModalListTitle, { color: colors.textSecondary }]}>Or pick a day</Text>
            <FlatList
              data={dateOptions}
              keyExtractor={(item) => item.key}
              style={styles.dateModalList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dateModalRow,
                    { borderColor: colors.border },
                    selectedDate?.toDateString() === item.date.toDateString() ? { backgroundColor: BLUE_COLOR + '20' } : {},
                  ]}
                  onPress={() => {
                    setSelectedDate(item.date);
                    setDateFilter('date');
                    setCalendarModalVisible(false);
                  }}
                >
                  <Text style={[styles.dateModalRowText, { color: colors.text }]}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={[styles.dateModalClose, { backgroundColor: colors.border }]} onPress={() => setCalendarModalVisible(false)}>
              <Text style={[styles.dateModalCloseText, { color: colors.text }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
            <Ionicons name="alert-circle-outline" size={iconScale(34)} color={colors.error} style={styles.stateIcon} />
            <Text style={[styles.stateTitle, { color: colors.text }]}>Unable to load bookings</Text>
            <Text style={[styles.stateDescription, { color: colors.textSecondary }]}>{error}</Text>
            {/session\s*expired|log in again|unauthorized|401/i.test(error) && onSessionExpired ? (
              <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.button }]} activeOpacity={0.85} onPress={onSessionExpired}>
                <Ionicons name="log-in-outline" size={iconScale(16)} color={colors.buttonText} />
                <Text style={[styles.retryButtonText, { color: colors.buttonText }]}>Log in again</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.button }]} activeOpacity={0.85} onPress={() => fetchBookings()}>
                <Ionicons name="refresh" size={iconScale(16)} color={colors.buttonText} />
                <Text style={[styles.retryButtonText, { color: colors.buttonText }]}>Try Again</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.stateContainer}>
            <Ionicons name={dateFilter !== 'all' ? 'calendar-outline' : 'car-outline'} size={iconScale(38)} color={colors.textSecondary} style={styles.stateIcon} />
            <Text style={[styles.stateTitle, { color: colors.text }]}>
              {dateFilter !== 'all' ? 'No bookings in this date range' : 'No booking requests yet'}
            </Text>
            <Text style={[styles.stateDescription, { color: colors.textSecondary }]}>
              {dateFilter !== 'all' ? 'Try another date filter or refresh the list.' : 'New booking requests from customers will appear here.'}
            </Text>
          </View>
        ) : (
        <View style={styles.requestsList}>
          {requests.map((request) => {
            const statusStyles = getStatusStyles(request.status);
            const initial = (request.customerName || 'U').charAt(0).toUpperCase();
            return (
              <View key={request.id} style={[styles.requestCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Header: Avatar, name, time ago, status */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>{initial}</Text>
                    </View>
                    <View style={styles.customerInfo}>
                      <Text style={[styles.customerName, { color: colors.text }]}>{request.customerName}</Text>
                      <Text style={styles.timeAgo}>{request.timeAgo}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyles.bg }]}>
                    {request.status === 'declined' && (
                      <Ionicons name="close-circle" size={iconScale(14)} color={statusStyles.icon} style={styles.statusIcon} />
                    )}
                    <Text style={[styles.statusBadgeText, { color: statusStyles.text }]}>
                      {statusStyles.label}
                    </Text>
                  </View>
                </View>

                {/* Vehicle: light grey box, car icon, VEHICLE label, primary text */}
                <View style={styles.vehicleSection}>
                  <View style={styles.vehicleIconContainer}>
                    <Ionicons name="car-outline" size={iconScale(18)} color={BLUE_COLOR} />
                  </View>
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleLabel}>VEHICLE</Text>
                    <Text style={styles.vehicleNumber}>{request.vehicle.primary}</Text>
                  </View>
                </View>

                {/* Scheduled + Service: two side-by-side rounded cards */}
                <View style={styles.metaRow}>
                  <View style={styles.scheduledCard}>
                    <View style={styles.scheduledIconWrap}>
                      <Ionicons name="calendar-outline" size={iconScale(14)} color="#374151" />
                    </View>
                    <Text style={styles.metaLabel}>SCHEDULED</Text>
                    <Text style={styles.scheduledDate}>{request.scheduledDate}</Text>
                    {request.scheduledTime ? (
                      <Text style={styles.scheduledTime}>{request.scheduledTime}</Text>
                    ) : null}
                  </View>
                  <View style={styles.serviceCard}>
                    <View style={styles.serviceIconWrap}>
                      <Ionicons name="sparkles" size={iconScale(14)} color="#7C3AED" />
                    </View>
                    <Text style={styles.metaLabel}>SERVICE</Text>
                    <Text style={styles.serviceName}>{request.service}</Text>
                  </View>
                </View>

                {/* Customer Notes: light grey box, Payment method + notes */}
                <View style={styles.notesContainer}>
                  <View style={styles.notesHeader}>
                    <Ionicons name="chatbubble-outline" size={iconScale(16)} color={BLUE_COLOR} style={styles.notesIcon} />
                    <Text style={styles.notesLabel}>Customer Notes</Text>
                  </View>
                  <Text style={[styles.notesValue, { color: colors.text }]}>
                    {request.notes ? `${request.notes}${request.paymentMethod ? ` · Payment: ${request.paymentMethod}` : ''}` : `Payment method: ${request.paymentMethod}`}
                  </Text>
                </View>

                {/* Amount: light green box, AMOUNT label, large price, payment pill */}
                <View style={styles.amountSectionWrap}>
                  <View style={styles.amountContent}>
                    <Text style={styles.amountLabel}>AMOUNT</Text>
                    <Text style={styles.amountValue}>{request.amount}</Text>
                  </View>
                  <View style={styles.paymentPill}>
                    <Text style={styles.paymentPillText}>{request.paymentMethod}</Text>
                  </View>
                </View>

                {/* Accept / Complete & Cancel actions */}
                {(request.status === 'pending' || request.status === 'accepted') && (
                  <View style={styles.footerActions}>
                    {request.status === 'pending' && (
                      <TouchableOpacity
                        style={[styles.acceptButton, acceptLoading[request.id] && styles.buttonDisabled]}
                        disabled={!!acceptLoading[request.id]}
                        onPress={() => handleAcceptBooking(request.id)}
                        activeOpacity={0.7}
                      >
                        {acceptLoading[request.id] ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-circle" size={iconScale(14)} color="#FFFFFF" />
                            <Text style={styles.acceptButtonText}>Complete</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                    {request.status === 'accepted' && (
                      <TouchableOpacity
                        style={[styles.completeButton, completeLoading[request.id] && styles.buttonDisabled]}
                        disabled={!!completeLoading[request.id]}
                        onPress={() => handleCompleteBooking(request.id)}
                        activeOpacity={0.7}
                      >
                        {completeLoading[request.id] ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-done" size={iconScale(14)} color="#FFFFFF" />
                            <Text style={styles.completeButtonText}>Complete</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.cancelButton, cancellationLoading[request.id] && styles.buttonDisabled]}
                      disabled={!!cancellationLoading[request.id]}
                      onPress={() => handleCancelBooking(request.id)}
                      activeOpacity={0.7}
                    >
                      {cancellationLoading[request.id] ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="close-circle" size={iconScale(14)} color="#FFFFFF" />
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
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
    paddingHorizontal: moderateScale(18),
    paddingBottom: moderateScale(4),
    paddingTop: 0,
    borderBottomWidth: 1,
  },
  backButton: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
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
    marginTop: moderateScale(2),
    textAlign: 'center',
    color: '#6B7280',
  },
  placeholder: {
    width: moderateScale(40),
  },
  reloadButton: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterSection: {
    paddingHorizontal: moderateScale(18),
    paddingVertical: moderateScale(10),
    borderBottomWidth: 1,
  },
  filterLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(8),
  },
  filterLabel: {
    ...TEXT_STYLES.label,
  },
  calendarIconBtn: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  filterChip: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(20),
    borderWidth: 1,
  },
  filterChipText: {
    ...TEXT_STYLES.label,
    fontSize: 13,
  },
  dateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  dateModalContent: {
    width: '100%',
    maxWidth: 320,
    maxHeight: '80%',
    borderRadius: moderateScale(14),
    padding: moderateScale(16),
  },
  dateModalTitle: {
    ...TEXT_STYLES.sectionHeadingMedium,
    marginBottom: moderateScale(12),
    textAlign: 'center',
  },
  dateModalAllBtn: {
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    marginBottom: moderateScale(12),
  },
  dateModalAllText: {
    ...TEXT_STYLES.bodyPrimary,
    textAlign: 'center',
  },
  dateModalListTitle: {
    ...TEXT_STYLES.label,
    marginBottom: moderateScale(8),
  },
  dateModalList: {
    maxHeight: moderateScale(240),
    marginBottom: moderateScale(12),
  },
  dateModalRow: {
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    borderBottomWidth: 1,
  },
  dateModalRowText: {
    ...TEXT_STYLES.bodyPrimary,
  },
  dateModalClose: {
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(10),
    alignItems: 'center',
  },
  dateModalCloseText: {
    ...TEXT_STYLES.buttonProduction,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: moderateScale(18),
    paddingTop: moderateScale(14),
    paddingBottom: verticalScale(56),
  },
  requestsList: {
    gap: 0,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: moderateScale(10),
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: moderateScale(10),
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  avatarCircle: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: BLUE_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(10),
  },
  avatarText: {
    ...TEXT_STYLES.cardTitleSemiBold,
    fontSize: FONT_SIZES.SECTION_HEADING,
    color: '#FFFFFF',
  },
  customerInfo: {
    flex: 1,
    minWidth: 0,
  },
  customerName: {
    ...TEXT_STYLES.cardTitleSemiBold,
    fontSize: FONT_SIZES.SECTION_HEADING,
    color: '#111827',
  },
  timeAgo: {
    ...TEXT_STYLES.bodySecondary,
    marginTop: 1,
    fontSize: FONT_SIZES.CAPTION_LARGE,
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(16),
    minWidth: moderateScale(72),
    justifyContent: 'center',
  },
  statusIcon: {
    marginRight: 0,
  },
  statusBadgeText: {
    ...TEXT_STYLES.bodySecondary,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
    letterSpacing: 0.2,
  },
  vehicleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(8),
    backgroundColor: '#F3F4F6',
    borderRadius: moderateScale(12),
    padding: moderateScale(10),
  },
  vehicleIconContainer: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(8),
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(10),
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleLabel: {
    ...TEXT_STYLES.caption,
    fontFamily: FONTS.INTER_MEDIUM,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 1,
  },
  vehicleNumber: {
    ...TEXT_STYLES.cardTitleSemiBold,
    fontSize: FONT_SIZES.SECTION_HEADING,
    fontFamily: FONTS.INTER_SEMIBOLD,
    color: BLUE_COLOR,
  },
  metaRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
    marginBottom: moderateScale(8),
  },
  scheduledCard: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: moderateScale(12),
    padding: moderateScale(10),
  },
  scheduledIconWrap: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(6),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(4),
  },
  scheduledDate: {
    ...TEXT_STYLES.cardTitleSemiBold,
    fontSize: FONT_SIZES.BODY_PRIMARY,
    color: '#111827',
    marginTop: 0,
  },
  scheduledTime: {
    ...TEXT_STYLES.bodySecondary,
    fontSize: FONT_SIZES.CAPTION_LARGE,
    marginTop: 1,
    color: '#6B7280',
  },
  serviceCard: {
    flex: 1,
    backgroundColor: '#F3E8FF',
    borderRadius: moderateScale(12),
    padding: moderateScale(10),
  },
  serviceIconWrap: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(6),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(4),
  },
  serviceName: {
    ...TEXT_STYLES.cardTitleSemiBold,
    fontSize: FONT_SIZES.BODY_PRIMARY,
    color: '#7C3AED',
    marginTop: 0,
  },
  metaLabel: {
    ...TEXT_STYLES.caption,
    fontFamily: FONTS.INTER_MEDIUM,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesContainer: {
    borderRadius: moderateScale(12),
    backgroundColor: '#F3F4F6',
    padding: moderateScale(10),
    marginBottom: moderateScale(8),
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(2),
  },
  notesIcon: {
    marginRight: moderateScale(5),
  },
  notesLabel: {
    ...TEXT_STYLES.cardTitleSemiBold,
    fontSize: FONT_SIZES.CAPTION_LARGE,
    color: BLUE_COLOR,
  },
  notesValue: {
    ...TEXT_STYLES.bodyPrimary,
    fontSize: FONT_SIZES.CAPTION_LARGE,
    color: '#374151',
  },
  amountSectionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#D1FAE5',
    borderRadius: moderateScale(12),
    padding: moderateScale(10),
    marginBottom: moderateScale(8),
  },
  amountContent: {
    flex: 1,
  },
  amountLabel: {
    ...TEXT_STYLES.caption,
    fontFamily: FONTS.INTER_MEDIUM,
    fontSize: FONT_SIZES.CAPTION,
    color: '#059669',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  amountValue: {
    ...TEXT_STYLES.sectionHeading,
    fontSize: FONT_SIZES.SECTION_HEADING_LARGE,
    fontWeight: '700',
    fontFamily: FONTS.INTER_BOLD,
    color: '#059669',
  },
  paymentPill: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(16),
  },
  paymentPillText: {
    ...TEXT_STYLES.bodySecondary,
    fontSize: FONT_SIZES.CAPTION_LARGE,
    fontFamily: FONTS.INTER_SEMIBOLD,
    color: '#111827',
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
    marginTop: moderateScale(8),
  },
  declineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(20),
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
    gap: moderateScale(4),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(20),
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
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(20),
    backgroundColor: '#16A34A',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    minHeight: moderateScale(32),
  },
  completeButtonText: {
    ...TEXT_STYLES.buttonProduction,
    fontSize: FONT_SIZES.BUTTON,
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(20),
    backgroundColor: '#DC2626',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  cancelButtonText: {
    ...TEXT_STYLES.buttonProduction,
    color: '#FFFFFF',
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(80),
    paddingHorizontal: moderateScale(24),
  },
  stateIcon: {
    marginBottom: moderateScale(12),
  },
  stateTitle: {
    ...TEXT_STYLES.sectionHeading,
    color: '#111827',
    textAlign: 'center',
  },
  stateDescription: {
    ...TEXT_STYLES.bodyPrimary,
    marginTop: moderateScale(6),
    color: '#6B7280',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: moderateScale(18),
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    backgroundColor: '#111827',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(14),
  },
  retryButtonText: {
    ...TEXT_STYLES.buttonProduction,
    color: '#FFFFFF',
  },
});

export default OwnerRequestsScreen;


