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
import { StatusBar } from 'react-native';
import { FONTS, FONT_SIZES } from '../../utils/fonts';

const BLUE_COLOR = '#0358a8';
const YELLOW_COLOR = '#f4c901';

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
  serviceId?: string | number;
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
      model: vehicleModel,
      plate: vehiclePlate !== 'Plate not provided' ? vehiclePlate : '',
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
    serviceId: booking?.service_id || booking?.serviceId || booking?.service?.id,
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
      return { bg: 'rgba(16,185,129,0.15)', text: '#10B981', label: 'Accepted' };
    }
    if (status === 'declined') {
      return { bg: 'rgba(239,68,68,0.15)', text: '#EF4444', label: 'Declined' };
    }
    return { bg: 'rgba(251,146,60,0.15)', text: '#F97316', label: 'Pending' };
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} translucent={false} />
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: '#FFFFFF', paddingTop: Platform.OS === 'ios' ? 10 : 10 }]}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
        )}
        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTitle}>New Requests</Text>
          <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
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
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.customerName}>{request.customerName}</Text>
                    <Text style={styles.timeAgo}>{request.timeAgo}</Text>
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
                    <Ionicons name="car-outline" size={18} color={BLUE_COLOR} />
                  </View>
                  <View style={styles.infoText}>
                      <Text style={styles.infoLabel}>VEHICLE</Text>
                      <Text style={styles.infoValue}>
                        {request.vehicle.plate || request.vehicle.model}
                      </Text>
                      {request.vehicle.plate && request.vehicle.model ? (
                        <Text style={styles.infoSubValue}>{request.vehicle.model}</Text>
                      ) : null}
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaPill}>
                    <Text style={styles.metaLabel}>SCHEDULED</Text>
                    <Text style={styles.metaValue}>{request.scheduled}</Text>
                  </View>
                  <View style={styles.metaPill}>
                    <Text style={styles.metaLabel}>SERVICE</Text>
                    <Text style={styles.metaValue}>{request.service}</Text>
                  </View>
                </View>

                {request.serviceId && (
                  <View style={styles.serviceIdRow}>
                    <Ionicons name="pricetag-outline" size={16} color={BLUE_COLOR} />
                    <Text style={styles.serviceIdLabel}>Service ID:</Text>
                    <Text style={styles.serviceIdValue}>{request.serviceId}</Text>
                  </View>
                )}

                {request.notes ? (
                  <View style={styles.notesContainer}>
                    <Text style={styles.notesLabel}>Customer Notes</Text>
                    <Text style={styles.notesValue}>{request.notes}</Text>
                  </View>
                ) : null}

                <View style={styles.footerRow}>
                  <View>
                    <Text style={styles.amountLabel}>Amount</Text>
                    <Text style={styles.amountValue}>{request.amount}</Text>
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
                        <ActivityIndicator size="small" color="#1A1A1A" />
                      ) : (
                        <>
                          <Ionicons name="close" size={14} color="#1A1A1A" />
                          <Text style={styles.declineText}>Decline</Text>
                        </>
                      )}
                    </Pressable>
                    <Pressable
                      style={[
                        styles.actionChip,
                        styles.acceptChip,
                        cancellationLoading[request.id] && styles.actionChipDisabled,
                      ]}
                      disabled={!!cancellationLoading[request.id]}
                      onPress={() => handleCompleteBooking(request.id)}
                    >
                      {cancellationLoading[request.id] ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                          <Text style={styles.acceptText}>Accept</Text>
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
    </View>
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
    paddingBottom: Platform.select({ ios: 10, android: 8 }),
    borderBottomWidth: 1,
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
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.HEADING_MEDIUM,
    fontWeight: '600',
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    color: '#1A1A1A',
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#666666',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Platform.select({ ios: 20, android: 18 }),
    paddingTop: Platform.select({ ios: 8, android: 6 }),
    paddingBottom: Platform.select({ 
      ios: 80, // Extra padding for iOS devices (5.4", 6.1", 6.3", 6.4", 6.5", 6.7")
      android: 70 // Extra padding for Android devices (5.4", 5.5", 6.1", 6.3", 6.4", 6.5", 6.7")
    }),
  },
  requestsList: {
    gap: 14,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: '#F3F4F6',
  },
  customerName: {
    fontSize: 18,
    fontWeight: '500',
    fontFamily: 'Montserrat-SemiBold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  timeAgo: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#666666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-Medium',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    backgroundColor: '#FAFBFC',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(3, 88, 168, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  infoSubValue: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#666666',
  },
  infoSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  metaPill: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  metaLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#1A1A1A',
  },
  serviceIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(3, 88, 168, 0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(3, 88, 168, 0.15)',
  },
  serviceIdLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#666666',
  },
  serviceIdValue: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: BLUE_COLOR,
  },
  notesContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(3, 88, 168, 0.2)',
    backgroundColor: 'rgba(3, 88, 168, 0.05)',
    padding: 12,
    marginBottom: 14,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: BLUE_COLOR,
    marginBottom: 6,
  },
  notesValue: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1A1A1A',
    lineHeight: 20,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  amountLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#666666',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#1A1A1A',
  },
  footerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 90,
    justifyContent: 'center',
  },
  actionChipDisabled: {
    opacity: 0.6,
  },
  declineChip: {
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  acceptChip: {
    borderColor: BLUE_COLOR,
    backgroundColor: BLUE_COLOR,
  },
  declineText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#1A1A1A',
  },
  acceptText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
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
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Montserrat-SemiBold',
    color: '#111827',
    textAlign: 'center',
  },
  stateDescription: {
    marginTop: 6,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
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
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});

export default OwnerRequestsScreen;


