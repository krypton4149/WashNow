import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface DashboardScreenProps {
  onBookWash?: () => void;
  onViewAll?: () => void;
  onActivityPress?: (activity: any) => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

interface Activity {
  id: string;
  title: string;
  serviceType: string;
  time: string;
  status: 'In Progress' | 'Completed';
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onBookWash,
  onViewAll,
  onActivityPress,
  onNotificationPress,
  onProfilePress,
}) => {
  const recentActivities: Activity[] = [
    {
      id: '1',
      title: 'Premium Auto Wash',
      serviceType: 'Exterior Wash',
      time: 'Today, 2:30 PM',
      status: 'In Progress',
    },
    {
      id: '2',
      title: 'Quick Shine Car Care',
      serviceType: 'Full Detail',
      time: 'Yesterday',
      status: 'Completed',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress':
        return '#3B82F6';
      case 'Completed':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const renderActivityItem = (activity: Activity) => (
    <TouchableOpacity
      key={activity.id}
      style={styles.activityItem}
      onPress={() => onActivityPress?.(activity)}
    >
      <View style={styles.activityContent}>
        <View style={styles.activityInfo}>
          <Text style={styles.activityTitle}>{activity.title}</Text>
          <Text style={styles.activityService}>{activity.serviceType}</Text>
          <Text style={styles.activityTimeText}>{activity.time}</Text>
        </View>
        <View style={styles.activityRight}>
          <View
            style={[
              styles.statusTag,
              { backgroundColor: getStatusColor(activity.status) },
            ]}
          >
            <Text style={styles.statusText}>{activity.status}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Home</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onNotificationPress}
            >
              <Ionicons name="notifications-outline" size={24} color="#000000" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onProfilePress}
            >
              <Ionicons name="person-outline" size={24} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Welcome Message */}
        <Text style={styles.welcomeText}>Welcome back, John!</Text>

        {/* Summary Cards */}
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>12</Text>
            <Text style={styles.summaryLabel}>Total Bookings</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>1</Text>
            <Text style={styles.summaryLabel}>Current Request</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>8</Text>
            <Text style={styles.summaryLabel}>Completed</Text>
          </View>
        </View>

        {/* Book a Car Wash Button */}
        <TouchableOpacity style={styles.bookButton} onPress={onBookWash}>
          <Text style={styles.bookButtonText}>Book a car wash</Text>
        </TouchableOpacity>

        {/* Recent Activity Section */}
        <View style={styles.activitySection}>
          <View style={styles.activityHeader}>
            <Text style={styles.activitySectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={onViewAll} style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.activityList}>
            {recentActivities.map(renderActivityItem)}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  welcomeText: {
    fontSize: 16,
    color: '#6B7280',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  summaryCards: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  bookButton: {
    backgroundColor: '#000000',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  activitySection: {
    paddingHorizontal: 20,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activitySectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  activityList: {
    gap: 12,
    paddingBottom: 20,
  },
  activityItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  activityService: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  activityTimeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  activityRight: {
    alignItems: 'center',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default DashboardScreen;

