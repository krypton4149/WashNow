import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authService from '../../services/authService';
import apiClient from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const BLUE_COLOR = '#0358a8';
const YELLOW_COLOR = '#f4c901';

interface OwnerDashboardScreenProps {
  onLogout?: () => void;
  onViewAllActivity?: () => void;
  onBookingRequestPress?: () => void;
  businessName?: string;
}

interface RecentActivity {
  id: string;
  customerName: string;
  carModel: string;
  time: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  price: string;
  bookingId: string;
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
  visitor: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
}

const OwnerDashboardScreen: React.FC<OwnerDashboardScreenProps> = ({
  onLogout,
  onViewAllActivity,
  onBookingRequestPress,
  businessName: businessNameProp = 'Premium Auto Wash',
}) => {
  const insets = useSafeAreaInsets();

  const [resolvedBusinessName, setResolvedBusinessName] = useState<string>(businessNameProp);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  const [metrics, setMetrics] = useState({
    todayBookings: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
  });

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);

  useEffect(() => {
    setResolvedBusinessName(businessNameProp);
  }, [businessNameProp]);

  useEffect(() => {
    let isMounted = true;

    const loadOwnerDashboardData = async () => {
      try {
        const storedUser = await authService.getUser();
        if (!isMounted || !storedUser) return;

        const profile =
          storedUser?.rawUserData ||
          storedUser?.userData ||
          storedUser;

        const nameCandidate =
          profile?.businessName ||
          profile?.business_name ||
          profile?.name ||
          storedUser?.businessName ||
          storedUser?.business_name ||
          storedUser?.name;

        if (typeof nameCandidate === 'string' && nameCandidate.trim().length > 0) {
          setResolvedBusinessName(nameCandidate.trim());
        }

        const totals =
          profile?.bookingsList?.booking_status_totals ||
          storedUser?.bookingsList?.booking_status_totals ||
          storedUser?.booking_status_totals ||
          {};

        const pending = Number(totals.Pending ?? totals.pending ?? 0);
        const completed = Number(totals.completed ?? totals.Completed ?? 0);
        const cancelled = Number(totals.cancelled ?? totals.Cancelled ?? 0);
        const total = pending + completed + cancelled;

        setMetrics({
          todayBookings: total,
          pending,
          completed,
          cancelled,
        });
      } catch (e) {
        console.log('Load error', e);
      }
    };

    loadOwnerDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch bookings from API
  useEffect(() => {
    let isMounted = true;

    const loadBookings = async () => {
      try {
        setIsLoadingBookings(true);
        const token = await authService.getToken();
        if (!token || !isMounted) return;

        const response = await apiClient.get('/user/bookings', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const bookingsData = 
          response.data?.data?.bookingsList?.bookings ||
          response.data?.data?.bookings ||
          response.data?.bookings ||
          [];

        if (!isMounted || !Array.isArray(bookingsData)) return;

        // Format time from 24-hour to 12-hour format
        const formatTime = (time24: string): string => {
          try {
            const [hours, minutes] = time24.split(':');
            const hour = parseInt(hours, 10);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12;
            return `${hour12}:${minutes} ${ampm}`;
          } catch {
            return time24;
          }
        };

        // Map API status to display status
        const mapStatus = (status: string): 'Pending' | 'In Progress' | 'Completed' | 'Cancelled' => {
          const statusLower = status.toLowerCase();
          if (statusLower === 'pending') return 'Pending';
          if (statusLower === 'completed') return 'Completed';
          if (statusLower === 'cancelled' || statusLower === 'canceled') return 'Cancelled';
          if (statusLower === 'in progress' || statusLower === 'in_progress') return 'In Progress';
          return 'Pending';
        };

        // Extract price from notes or use default
        const extractPrice = (notes: string): string => {
          const priceMatch = notes.match(/\$(\d+)/);
          if (priceMatch) {
            return `$${priceMatch[1]}`;
          }
          return '$25'; // Default price
        };

        // Transform bookings to RecentActivity format and take first 3
        const activities: RecentActivity[] = bookingsData
          .slice(0, 3)
          .map((booking: Booking) => ({
            id: booking.id.toString(),
            customerName: booking.visitor?.name || 'Unknown Customer',
            carModel: booking.vehicle_no || 'N/A',
            time: formatTime(booking.booking_time || ''),
            status: mapStatus(booking.status || 'Pending'),
            price: extractPrice(booking.notes || ''),
            bookingId: booking.booking_id || '',
          }));

        if (isMounted) {
          setRecentActivities(activities);
        }
      } catch (error) {
        console.log('Failed to load bookings:', error);
        if (isMounted) {
          setRecentActivities([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingBookings(false);
        }
      }
    };

    loadBookings();

    return () => {
      isMounted = false;
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return { bg: 'rgba(251,146,60,0.15)', text: '#F97316' };
      case 'In Progress':
        return { bg: 'rgba(59,130,246,0.15)', text: '#3B82F6' };
      case 'Completed':
        return { bg: 'rgba(16,185,129,0.15)', text: '#10B981' };
      case 'Cancelled':
        return { bg: 'rgba(239,68,68,0.15)', text: '#EF4444' };
      default:
        return { bg: 'rgba(107,114,128,0.15)', text: '#6B7280' };
    }
  };

  const performLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      const result = await authService.logoutOwner();
      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to logout.');
        return;
      }
      onLogout?.();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => performLogout() },
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
            <Text style={styles.welcomeText}>Welcome to KwikWash,</Text>
            <Text style={styles.businessName}>{resolvedBusinessName}</Text>
          </View>
          <TouchableOpacity onPress={confirmLogout} style={styles.iconButton}>
            <Ionicons name="log-out-outline" size={25} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Metric Cards */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Ionicons name="calendar-outline" color="#fff" size={22} />
            <Text style={styles.metricValue}>{metrics.todayBookings}</Text>
            <Text style={styles.metricLabel}>Total</Text>
          </View>

          <View style={styles.metricCard}>
            <Ionicons name="time-outline" color={YELLOW_COLOR} size={22} />
            <Text style={styles.metricValue}>{metrics.pending}</Text>
            <Text style={styles.metricLabel}>Pending</Text>
          </View>

          <View style={styles.metricCard}>
            <Ionicons name="checkmark-circle-outline" color="#fff" size={22} />
            <Text style={styles.metricValue}>{metrics.completed}</Text>
            <Text style={styles.metricLabel}>Done</Text>
          </View>

          <View style={styles.metricCard}>
            <Ionicons name="close-circle-outline" color="#fff" size={22} />
            <Text style={styles.metricValue}>{metrics.cancelled}</Text>
            <Text style={styles.metricLabel}>Cancel</Text>
          </View>
        </View>
      </View>

      {/* WHITE CONTENT */}
      <ScrollView style={styles.content}>
        {/* Yellow Banner */}
        <TouchableOpacity
          style={styles.banner}
          onPress={onBookingRequestPress}
          activeOpacity={0.8}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>New Booking Requests</Text>
            <Text style={styles.bannerSubtitle}>
              {metrics.pending} customers waiting
            </Text>
          </View>

          <View style={styles.bannerBadge}>
            <Text style={styles.bannerBadgeText}>{metrics.pending}</Text>
          </View>
        </TouchableOpacity>

        {/* Recent Activity */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>

          <TouchableOpacity style={styles.seeAllBtn} onPress={onViewAllActivity}>
            <Text style={styles.seeAllText}>See all</Text>
            <Ionicons name="chevron-forward" size={16} color={BLUE_COLOR} />
          </TouchableOpacity>
        </View>

        {isLoadingBookings ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading bookings...</Text>
          </View>
        ) : recentActivities.length > 0 ? (
          recentActivities.map((a) => {
            const status = getStatusColor(a.status);
            return (
              <View key={a.id} style={styles.activityCard}>
                <View style={styles.leftIcon}>
                  <Ionicons name="people-outline" color="#fff" size={20} />
                </View>

                <View style={styles.cardContent}>
                  <Text style={styles.customerName}>{a.customerName}</Text>
                  <Text style={styles.carModel}>{a.carModel}</Text>
                  <View style={styles.timeContainer}>
                    <Ionicons
                      name="time-outline"
                      color="#666"
                      size={14}
                      style={styles.timeIcon}
                    />
                    <Text style={styles.time}>{a.time}</Text>
                  </View>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                    <Text style={[styles.statusText, { color: status.text }]}>
                      {a.status}
                    </Text>
                  </View>
                  <Text style={styles.price}>{a.price}</Text>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recent bookings</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// =====================
//        STYLES
// =====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BLUE_COLOR, // keeps the top NOTCH blue
  },

  /* BLUE HEADER WITH LARGE CURVE */
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
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  businessName: {
    color: '#fff',
    fontSize: 28,
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
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginVertical: 4,
  },
  metricLabel: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    opacity: 0.9,
  },

  /* CONTENT AREA */
  content: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
  },

  /* yellow banner */
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
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#1A1A1A',
    marginBottom: 3,
  },
  bannerSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#1A1A1A',
  },
  bannerBadge: {
    backgroundColor: '#fff',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },

  /* Recent Activity Section */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Montserrat-SemiBold',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: BLUE_COLOR,
    marginRight: 4,
  },

  /* Activity Card */
  activityCard: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  leftIcon: {
    width: 36,
    height: 36,
    backgroundColor: BLUE_COLOR,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardContent: {
    flex: 1,
    marginLeft: 10,
  },

  customerName: {
    fontSize: 15,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    marginBottom: 3,
  },
  carModel: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginBottom: 6,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    marginRight: 4,
  },
  time: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#666',
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter-Medium',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
  },
});

export default OwnerDashboardScreen;
