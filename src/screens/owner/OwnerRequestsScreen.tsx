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
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../../services/authService';
import apiClient from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { platformEdges } from '../../utils/responsive';

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

  if (!dateCandidate && !timeCandidate) {
    return 'Not scheduled';
  }

  let formattedDate = dateCandidate;
  const parsedDate = dateCandidate ? new Date(dateCandidate) : null;
  if (parsedDate && !Number.isNaN(parsedDate.getTime())) {
    formattedDate = parsedDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  }

  let formattedTime = timeCandidate;
  const parsedTime = timeCandidate ? new Date(`1970-01-01T${timeCandidate}`) : null;
  if ((!formattedTime || formattedTime === dateCandidate) && parsedDate && !Number.isNaN(parsedDate.getTime())) {
    formattedTime = parsedDate.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  } else if (parsedTime && !Number.isNaN(parsedTime.getTime())) {
    formattedTime = parsedTime.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return [formattedDate, formattedTime].filter(Boolean).join(', ');
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

  const vehicleModel = ensureString('Vehicle not specified',
    booking?.vehicleModel,
    booking?.vehicle_model,
    booking?.vehicle?.model,
    booking?.car_model,
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
      primary: vehiclePlate !== 'Plate not provided' ? vehiclePlate : vehicleModel,
      secondary: vehiclePlate !== 'Plate not provided' ? vehicleModel : '',
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

      const token = await authService.getToken();
      if (!token) {
        throw new Error('Missing authentication token. Please log in again.');
      }

      const response = await apiClient.get('/user/bookings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = response.data;
      const bookingsArray = extractBookingArray(payload);

      console.log('[OwnerRequestsScreen] bookings response extracted', {
        count: bookingsArray.length,
        payloadKeys: payload ? Object.keys(payload) : null,
        sample: bookingsArray.slice(0, 2),
      });

      setRawBookings(bookingsArray);
      setCancellationLoading({});
      hasHydratedCacheRef.current = true;
      try {
        await AsyncStorage.setItem(BOOKINGS_CACHE_KEY, JSON.stringify({
          timestamp: Date.now(),
          data: bookingsArray,
        }));
      } catch (cacheError) {
        console.error('[OwnerRequestsScreen] failed to cache bookings', cacheError);
      }
    } catch (fetchError: any) {
      console.error('[OwnerRequestsScreen] failed to load bookings', {
        message: fetchError?.message,
        response: fetchError?.response?.data,
        status: fetchError?.response?.status,
        request: fetchError?.request,
        error: fetchError,
      });

      // Handle network errors (no response, timeout, connection issues)
      if (!fetchError?.response && (fetchError?.message?.includes('Network') || fetchError?.message?.includes('timeout') || fetchError?.code === 'ECONNABORTED')) {
        const errorMessage = 'Network Error - Please check your internet connection and try again.';
        setError(errorMessage);
        return;
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
        setError(fetchError?.message || 'Failed to load booking requests. Please try again.');
      }
      
      setRawBookings([]);
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
    const sorted = [...rawBookings].sort((a, b) => {
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

  const handleCompleteBooking = useCallback((bookingId: string) => {
    if (!bookingId) {
      return;
    }

    Alert.alert(
      'Mark as Completed',
      'Confirm that this booking has been completed?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Completed',
          onPress: async () => {
            setBookingActionLoading(bookingId, true);
            try {
              const result = await authService.completeOwnerBooking(bookingId);
              if (!result.success) {
                Alert.alert('Error', result.error || 'Failed to update booking status.');
                return;
              }
              Alert.alert('Success', result.message || 'Booking marked as completed.');
              await fetchBookings(true);
            } catch (completeError: any) {
              Alert.alert('Error', completeError?.message || 'Failed to update booking status.');
            } finally {
              setBookingActionLoading(bookingId, false);
            }
          },
        },
      ],
    );
  }, [fetchBookings, setBookingActionLoading]);

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={platformEdges as any}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        <View style={styles.headerTextGroup}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>New Requests</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{headerSubtitle}</Text>
        </View>
        <View style={styles.placeholder} />
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
              <View key={request.id} style={[styles.requestCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.button === '#2563EB' ? '#000' : '#020617' }]}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={[styles.customerName, { color: colors.text }]}>{request.customerName}</Text>
                    <Text style={[styles.timeAgo, { color: colors.textSecondary }]}>{request.timeAgo}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusStyles.bg },
                    ]}
                  >
                    <Text
                      style={[styles.statusBadgeText, { color: statusStyles.text }]}
                    >
                      {statusStyles.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="car-outline" size={20} color={colors.text} />
                  </View>
                  <View style={styles.infoText}>
                      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Vehicle</Text>
                      <Text style={[styles.infoValue, { color: colors.text }]}>{request.vehicle.primary}</Text>
                      {request.vehicle.secondary ? (
                        <Text style={[styles.infoSubValue, { color: colors.textSecondary }]}>{request.vehicle.secondary}</Text>
                      ) : null}
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="location-outline" size={20} color={colors.text} />
                  </View>
                  <View style={styles.infoText}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Location</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>{request.location.address}</Text>
                      {request.location.distance ? (
                    <View style={styles.infoSubRow}>
                      <Ionicons name="navigate-outline" size={12} color={colors.textSecondary} />
                      <Text style={[styles.infoSubValue, { color: colors.textSecondary }]}>{request.location.distance}</Text>
                    </View>
                      ) : null}
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaPill}>
                    <Text style={styles.metaLabel}>Scheduled</Text>
                    <Text style={styles.metaValue}>{request.scheduled}</Text>
                  </View>
                  <View style={styles.metaPill}>
                    <Text style={styles.metaLabel}>Service</Text>
                    <Text style={styles.metaValue}>{request.service}</Text>
                  </View>
                </View>

                {request.notes ? (
                  <View style={[styles.notesContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.notesLabel, { color: colors.text }]}>{'Customer Notes'}</Text>
                    <Text style={[styles.notesValue, { color: colors.textSecondary }]}>{request.notes}</Text>
                  </View>
                ) : null}

                <View style={styles.footerRow}>
                  <View>
                    <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Amount</Text>
                    <Text style={[styles.amountValue, { color: colors.text }]}>{request.amount}</Text>
                  </View>
                  <View style={styles.footerActions}>
                    <Pressable
                      style={[
                        styles.actionChip,
                        styles.declineChip,
                        cancellationLoading[request.id] && styles.actionChipDisabled,
                      ]}
                      disabled={!!cancellationLoading[request.id]}
                      onPress={() => handleCancelBooking(request.id)}
                    >
                      {cancellationLoading[request.id] ? (
                        <ActivityIndicator size="small" color={colors.text} />
                      ) : (
                        <>
                          <Ionicons name="close" size={16} color={colors.text} />
                          <Text style={[styles.declineText, { color: colors.text }]}>{'Decline'}</Text>
                        </>
                      )}
                    </Pressable>
                    <Pressable
                      style={[
                        styles.actionChip,
                        styles.acceptChip,
                        cancellationLoading[request.id] && styles.actionChipDisabled,
                        { backgroundColor: colors.button, borderColor: colors.button },
                      ]}
                      disabled={!!cancellationLoading[request.id]}
                      onPress={() => handleCompleteBooking(request.id)}
                    >
                      {cancellationLoading[request.id] ? (
                        <ActivityIndicator size="small" color={colors.buttonText} />
                      ) : (
                        <>
                          <Ionicons name="checkmark" size={16} color={colors.buttonText} />
                          <Text style={[styles.acceptText, { color: colors.buttonText }]}>{'Accept'}</Text>
                        </>
                      )}
                    </Pressable>
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
    paddingHorizontal: Platform.select({ ios: 20, android: 18 }),
    paddingTop: Platform.select({ ios: 10, android: 8 }),
    paddingBottom: Platform.select({ ios: 14, android: 12 }),
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTextGroup: {
    flex: 1,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: Platform.select({ ios: 26, android: 24 }),
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: Platform.select({ ios: 15, android: 14 }),
    color: '#6B7280',
  },
  placeholder: {
    width: 40,
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
    gap: 14,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Platform.select({ ios: 20, android: 18 }),
    padding: Platform.select({ ios: 20, android: 18 }),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: Platform.select({ ios: 7, android: 6 }) },
    shadowOpacity: Platform.select({ ios: 0.06, android: 0.05 }),
    shadowRadius: Platform.select({ ios: 10, android: 8 }),
    elevation: Platform.select({ ios: 0, android: 2 }),
    gap: Platform.select({ ios: 16, android: 14 }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerName: {
    fontSize: Platform.select({ ios: 19, android: 18 }),
    fontWeight: '700',
    color: '#111827',
  },
  timeAgo: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  infoSubValue: {
    fontSize: 13,
    color: '#6B7280',
  },
  infoSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metaPill: {
    flex: 1,
    backgroundColor: '#F5F6FA',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  metaLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  notesContainer: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    padding: 14,
    gap: 6,
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  notesValue: {
    fontSize: 14,
    color: '#1E3A8A',
    lineHeight: 20,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  footerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionChipDisabled: {
    opacity: 0.6,
  },
  declineChip: {
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  acceptChip: {
    borderColor: '#000000',
    backgroundColor: '#000000',
  },
  declineText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  acceptText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
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
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  stateDescription: {
    marginTop: 6,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
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
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default OwnerRequestsScreen;


