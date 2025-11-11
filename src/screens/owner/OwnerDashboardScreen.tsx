import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authService from '../../services/authService';

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
  const [resolvedBusinessName, setResolvedBusinessName] = useState<string>(businessNameProp);

  useEffect(() => {
    setResolvedBusinessName(businessNameProp);
  }, [businessNameProp]);

  useEffect(() => {
    let isMounted = true;

    const loadBusinessName = async () => {
      try {
        const storedUser = await authService.getUser();
        if (!isMounted || !storedUser) {
          return;
        }

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
      } catch (error) {
        // Swallow error silently; keep existing business name fallback
      }
    };

    loadBusinessName();

    return () => {
      isMounted = false;
    };
  }, []);

  // Dummy data - in real app, this would come from API
  const [metrics] = useState({
    todayBookings: 12,
    activeNow: 5,
    completed: 7,
    todayRevenue: 340,
  });

  const [newBookingRequests] = useState(3);

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

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: onLogout },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.businessName}>{resolvedBusinessName}</Text>
          </View>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="exit-outline" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Metrics Cards */}
        <View style={styles.metricsContainer}>
          {/* Today's Bookings */}
          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}>
              <Ionicons name="calendar-outline" size={24} color="#111827" />
            </View>
            <Text style={styles.metricValue}>{metrics.todayBookings}</Text>
            <Text style={styles.metricLabel}>Today's Bookings</Text>
          </View>

          {/* Active Now */}
          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}>
              <Ionicons name="time-outline" size={24} color="#111827" />
            </View>
            <Text style={styles.metricValue}>{metrics.activeNow}</Text>
            <Text style={styles.metricLabel}>Active Now</Text>
          </View>

          {/* Completed */}
          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#111827" />
            </View>
            <Text style={styles.metricValue}>{metrics.completed}</Text>
            <Text style={styles.metricLabel}>Completed</Text>
          </View>

          {/* Today's Revenue */}
          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}>
              <Ionicons name="cash-outline" size={24} color="#111827" />
            </View>
            <Text style={styles.metricValue}>${metrics.todayRevenue}</Text>
            <Text style={styles.metricLabel}>Today's Revenue</Text>
          </View>
        </View>

        {/* New Booking Requests Banner */}
        <TouchableOpacity 
          style={styles.bookingRequestsBanner}
          onPress={onBookingRequestPress}
          activeOpacity={0.8}
        >
          <View style={styles.bookingRequestsLeft}>
            <Text style={styles.bookingRequestsTitle}>New Booking Requests</Text>
            <Text style={styles.bookingRequestsSubtitle}>
              {newBookingRequests} customers waiting for response
            </Text>
          </View>
          <View style={styles.bookingRequestsBadge}>
            <Text style={styles.bookingRequestsBadgeText}>{newBookingRequests}</Text>
          </View>
        </TouchableOpacity>

        {/* Recent Activity Section */}
        <View style={styles.recentActivitySection}>
          <View style={styles.recentActivityHeader}>
            <Text style={styles.recentActivityTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={onViewAllActivity}>
              <Text style={styles.seeAllText}>See all &gt;</Text>
            </TouchableOpacity>
          </View>

          {/* Activity List */}
          <View style={styles.activityList}>
            {recentActivities.map((activity) => {
              const statusColors = getStatusColor(activity.status);
              return (
                <View key={activity.id} style={styles.activityCard}>
                  <View style={styles.activityLeft}>
                    <Text style={styles.activityCustomerName}>
                      {activity.customerName}
                    </Text>
                    <Text style={styles.activityCarModel}>
                      {activity.carModel}
                    </Text>
                    <View style={styles.activityTimeContainer}>
                      <Ionicons name="time-outline" size={14} color="#6B7280" />
                      <Text style={styles.activityTime}>{activity.time}</Text>
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
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  headerLeft: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
    marginBottom: 4,
  },
  businessName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  logoutButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metricIconContainer: {
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '400',
  },
  bookingRequestsBanner: {
    backgroundColor: '#000000',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  bookingRequestsLeft: {
    flex: 1,
  },
  bookingRequestsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bookingRequestsSubtitle: {
    fontSize: 14,
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
    borderRadius: 12,
    padding: 14,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  activityCarModel: {
    fontSize: 14,
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


