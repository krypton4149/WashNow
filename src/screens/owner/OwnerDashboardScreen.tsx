import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authService from '../../services/authService';
import apiClient from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { platformEdges } from '../../utils/responsive';

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
  status: 'Pending' | 'In Progress' | 'Completed';
  price: string;
}

const OwnerDashboardScreen: React.FC<OwnerDashboardScreenProps> = ({
  onLogout,
  onViewAllActivity,
  onBookingRequestPress,
  businessName: businessNameProp = 'Premium Auto Wash',
}) => {
  const { colors } = useTheme();
  const [resolvedBusinessName, setResolvedBusinessName] = useState<string>(businessNameProp);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [metrics, setMetrics] = useState({
    todayBookings: 0,
    activeNow: 0,
    completed: 0,
    todayRevenue: 0,
    pending: 0,
    cancelled: 0,
  });

  useEffect(() => {
    setResolvedBusinessName(businessNameProp);
  }, [businessNameProp]);

  useEffect(() => {
    let isMounted = true;

    const loadOwnerDashboardData = async () => {
      try {
        const storedUser = await authService.getUser();
        if (!isMounted || !storedUser) {
          return;
        }

        console.log('[OwnerDashboardScreen] stored user', storedUser);

        const profile =
          storedUser?.rawUserData ||
          storedUser?.userData ||
          storedUser;

        console.log('[OwnerDashboardScreen] resolved profile', profile);

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

        const bookingTotals =
          profile?.bookingsList?.booking_status_totals ||
          storedUser?.bookingsList?.booking_status_totals ||
          storedUser?.booking_status_totals ||
          storedUser?.bookingsList ||
          storedUser?.bookings_list ||
          storedUser?.bookingList ||
          (profile?.bookingsList && typeof profile.bookingsList === 'object' ? profile.bookingsList : {}) ||
          {};

        console.log('[OwnerDashboardScreen] booking totals raw', bookingTotals);

        const pending =
          Number(bookingTotals.Pending ?? bookingTotals.pending ?? bookingTotals['Pending'] ?? bookingTotals['pending'] ?? 0) || 0;
        const completed =
          Number(bookingTotals.completed ?? bookingTotals.Completed ?? bookingTotals['completed'] ?? bookingTotals['Completed'] ?? 0) || 0;
        const cancelled =
          Number(bookingTotals.cancelled ?? bookingTotals.Cancelled ?? bookingTotals['cancelled'] ?? bookingTotals['Cancelled'] ?? 0) || 0;
        const total = pending + completed + cancelled;

        setMetrics({
          todayBookings: total,
          activeNow: pending,
          completed,
          todayRevenue: storedUser?.todayRevenue ??
            storedUser?.today_revenue ??
            profile?.todayRevenue ??
            profile?.today_revenue ??
            0,
          pending,
          cancelled,
        });
      } catch (error) {
        console.log('[OwnerDashboardScreen] failed to load owner dashboard data', error);
      }
    };

    loadOwnerDashboardData();

    const loadBookingSummaryFromApi = async () => {
      try {
        const token = await authService.getToken();
        if (!token || !isMounted) {
          return;
        }

        const response = await apiClient.get('/user/bookings', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const summary =
          response.data?.data?.bookingsList?.booking_status_totals ||
          response.data?.data?.booking_status_totals ||
          response.data?.booking_status_totals ||
          {};

        console.log('[OwnerDashboardScreen] booking totals api', summary);

        const pending =
          Number(summary.Pending ?? summary.pending ?? summary['Pending'] ?? summary['pending'] ?? metrics.pending) || 0;
        const completed =
          Number(summary.completed ?? summary.Completed ?? summary['completed'] ?? summary['Completed'] ?? metrics.completed) || 0;
        const cancelled =
          Number(summary.cancelled ?? summary.Cancelled ?? summary['cancelled'] ?? summary['Cancelled'] ?? metrics.cancelled) || 0;
        const total = pending + completed + cancelled;

        if (isMounted) {
          setMetrics((prev) => ({
            ...prev,
            todayBookings: total,
            pending,
            completed,
            cancelled,
          }));
        }
      } catch (error) {
        console.log('[OwnerDashboardScreen] failed to fetch booking summary from API', error);
      }
    };

    loadBookingSummaryFromApi();

    return () => {
      isMounted = false;
    };
  }, []);

  const [recentActivities] = useState<RecentActivity[]>([
    {
      id: '1',
      customerName: 'John Smith',
      carModel: 'Tesla Model 3',
      time: '10:30 AM',
      status: 'Pending',
      price: '$25',
    },
    {
      id: '2',
      customerName: 'Sarah Johnson',
      carModel: 'Honda Civic',
      time: '11:00 AM',
      status: 'In Progress',
      price: '$25',
    },
  ]);

  const pendingSummary = metrics.pending > 0
    ? `${metrics.pending} customers waiting for response`
    : 'No pending booking requests';

  const themeStyles = useMemo(() => ({
    container: { backgroundColor: colors.background },
    scrollContent: { backgroundColor: colors.background },
    headerText: { color: colors.text },
    metricCard: { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.button === '#1F2937' ? '#000' : '#020617' },
    metricLabel: { color: colors.textSecondary },
    metricValue: { color: colors.text },
    banner: { backgroundColor: colors.button },
    bannerTitle: { color: colors.buttonText },
    bannerSubtitle: { color: colors.buttonText + 'CC' },
    bannerBadge: { backgroundColor: colors.surface },
    bannerBadgeText: { color: colors.text },
    sectionTitle: { color: colors.text },
    seeAll: { color: colors.textSecondary },
    activityCard: { backgroundColor: colors.card, borderColor: colors.border },
    activityText: { color: colors.text },
    activitySub: { color: colors.textSecondary },
  }), [colors]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return { bg: 'rgba(251, 146, 60, 0.15)', text: '#F97316' };
      case 'In Progress':
        return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6' };
      case 'Completed':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981' };
      default:
        return { bg: 'rgba(107, 114, 128, 0.15)', text: '#6B7280' };
    }
  };

  const performLogout = async () => {
    if (isLoggingOut) {
      return;
    }
    setIsLoggingOut(true);
    try {
      const result = await authService.logoutOwner();
      if (!result.success) {
        Alert.alert('Logout Failed', result.error || 'Unable to logout. Please try again.');
        return;
      }

      if (onLogout) {
        onLogout();
        return;
      }

      Alert.alert('Logged Out', result.message || 'You have been logged out.');
    } catch (error: any) {
      Alert.alert('Logout Failed', error?.message || 'Unable to logout. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogout = () => {
    if (isLoggingOut) {
      return;
    }
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => { void performLogout(); } },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, themeStyles.container]} edges={platformEdges as any}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, themeStyles.scrollContent]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.welcomeText, themeStyles.headerText]}>Welcome back,</Text>
            <Text style={[styles.businessName, themeStyles.headerText]}>{resolvedBusinessName}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <Ionicons name="exit-outline" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Metrics Cards */}
        <View style={styles.metricsContainer}>
          {/* Total / Today's Bookings */}
          <View style={[styles.metricCard, themeStyles.metricCard]}>
            <View style={styles.metricIconContainer}>
              <Ionicons name="calendar-outline" size={24} color="#111827" />
            </View>
            <Text style={[styles.metricValue, themeStyles.metricValue]}>{metrics.todayBookings}</Text>
            <Text style={[styles.metricLabel, themeStyles.metricLabel]}>Total Bookings</Text>
          </View>

          {/* Pending (Active Now) */}
          <View style={[styles.metricCard, themeStyles.metricCard]}>
            <View style={styles.metricIconContainer}>
              <Ionicons name="time-outline" size={24} color="#111827" />
            </View>
            <Text style={[styles.metricValue, themeStyles.metricValue]}>{metrics.pending}</Text>
            <Text style={[styles.metricLabel, themeStyles.metricLabel]}>Pending</Text>
          </View>

          {/* Completed */}
          <View style={[styles.metricCard, themeStyles.metricCard]}>
            <View style={styles.metricIconContainer}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#111827" />
            </View>
            <Text style={[styles.metricValue, themeStyles.metricValue]}>{metrics.completed}</Text>
            <Text style={[styles.metricLabel, themeStyles.metricLabel]}>Completed</Text>
          </View>

          {/* Cancelled */}
          <View style={[styles.metricCard, themeStyles.metricCard]}>
            <View style={styles.metricIconContainer}>
              <Ionicons name="close-circle-outline" size={24} color="#111827" />
            </View>
            <Text style={[styles.metricValue, themeStyles.metricValue]}>{metrics.cancelled}</Text>
            <Text style={[styles.metricLabel, themeStyles.metricLabel]}>Cancelled</Text>
          </View>
        </View>

        {/* New Booking Requests Banner */}
        <TouchableOpacity 
          style={[styles.bookingRequestsBanner, themeStyles.banner]}
          onPress={onBookingRequestPress}
          activeOpacity={0.8}
        >
          <View style={styles.bookingRequestsLeft}>
            <Text style={[styles.bookingRequestsTitle, themeStyles.bannerTitle]}>New Booking Requests</Text>
            <Text style={[styles.bookingRequestsSubtitle, themeStyles.bannerSubtitle]}>
              {pendingSummary}
            </Text>
          </View>
          <View style={[styles.bookingRequestsBadge, themeStyles.bannerBadge]}>
            <Text style={[styles.bookingRequestsBadgeText, themeStyles.bannerBadgeText]}>{metrics.pending}</Text>
          </View>
        </TouchableOpacity>

        {/* Recent Activity Section */}
        <View style={styles.recentActivitySection}>
          <View style={styles.recentActivityHeader}>
            <Text style={[styles.recentActivityTitle, themeStyles.sectionTitle]}>Recent Activity</Text>
            <TouchableOpacity onPress={onViewAllActivity}>
              <Text style={[styles.seeAllText, themeStyles.seeAll]}>See all &gt;</Text>
            </TouchableOpacity>
          </View>

          {/* Activity List */}
          <View style={styles.activityList}>
            {recentActivities.map((activity) => {
              const statusColors = getStatusColor(activity.status);
              return (
                <View key={activity.id} style={[styles.activityCard, themeStyles.activityCard]}>
                  <View style={styles.activityLeft}>
                    <Text style={[styles.activityCustomerName, themeStyles.activityText]}>
                      {activity.customerName}
                    </Text>
                    <Text style={[styles.activityCarModel, themeStyles.activitySub]}>
                      {activity.carModel}
                    </Text>
                    <View style={styles.activityTimeContainer}>
                      <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                      <Text style={[styles.activityTime, themeStyles.activitySub]}>{activity.time}</Text>
                    </View>
                  </View>
                  <View style={styles.activityRight}>
                    <View 
                      style={[
                        styles.activityStatusBadge,
                        { backgroundColor: statusColors.bg }
                      ]}
                    >
                      <Text 
                        style={[
                          styles.activityStatusText,
                          { color: statusColors.text }
                        ]}
                      >
                        {activity.status}
                      </Text>
                    </View>
                    <Text style={styles.activityPrice}>{activity.price}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Platform.select({ ios: 20, android: 18 }),
    paddingTop: Platform.select({ ios: 16, android: 12 }),
    paddingBottom: Platform.select({ ios: 60, android: 50 }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Platform.select({ ios: 20, android: 18 }),
  },
  headerLeft: {
    flex: 1,
  },
  welcomeText: {
    fontSize: Platform.select({ ios: 15, android: 14 }),
    color: '#6B7280',
    fontWeight: '400',
    marginBottom: 4,
  },
  businessName: {
    fontSize: Platform.select({ ios: 30, android: 28 }),
    fontWeight: '700',
    color: '#111827',
    letterSpacing: Platform.select({ ios: -0.6, android: -0.5 }),
  },
  logoutButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonDisabled: {
    opacity: 0.5,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 18,
    gap: 10,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: Platform.select({ ios: 14, android: 12 }),
    padding: Platform.select({ ios: 16, android: 14 }),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metricIconContainer: {
    marginBottom: 10,
  },
  metricValue: {
    fontSize: Platform.select({ ios: 26, android: 24 }),
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: Platform.select({ ios: 13, android: 12 }),
    color: '#6B7280',
    fontWeight: '400',
  },
  bookingRequestsBanner: {
    backgroundColor: '#000000',
    borderRadius: Platform.select({ ios: 16, android: 14 }),
    paddingVertical: Platform.select({ ios: 18, android: 16 }),
    paddingHorizontal: Platform.select({ ios: 20, android: 18 }),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Platform.select({ ios: 22, android: 20 }),
  },
  bookingRequestsLeft: {
    flex: 1,
  },
  bookingRequestsTitle: {
    fontSize: Platform.select({ ios: 19, android: 18 }),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bookingRequestsSubtitle: {
    fontSize: Platform.select({ ios: 15, android: 14 }),
    color: '#FFFFFF',
    opacity: 0.8,
  },
  bookingRequestsBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingRequestsBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  recentActivitySection: {
    marginBottom: 18,
  },
  recentActivityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  recentActivityTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activityList: {
    gap: 10,
  },
  activityCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: Platform.select({ ios: 14, android: 12 }),
    padding: Platform.select({ ios: 16, android: 14 }),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activityLeft: {
    flex: 1,
  },
  activityCustomerName: {
    fontSize: Platform.select({ ios: 17, android: 16 }),
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  activityCarModel: {
    fontSize: Platform.select({ ios: 15, android: 14 }),
    color: '#6B7280',
    marginBottom: 8,
  },
  activityTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  activityRight: {
    alignItems: 'flex-end',
  },
  activityStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  activityStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activityPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
});

export default OwnerDashboardScreen;


