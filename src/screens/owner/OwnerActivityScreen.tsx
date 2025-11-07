import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface OwnerActivityScreenProps {
  onBack?: () => void;
}

interface Activity {
  id: string;
  customerName: string;
  carModel: string;
  serviceType: string;
  time: string;
  date: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  price: string;
}

const OwnerActivityScreen: React.FC<OwnerActivityScreenProps> = ({
  onBack,
}) => {
  // Dummy data - in real app, this would come from API
  const [activities] = useState<Activity[]>([
    {
      id: '1',
      customerName: 'John Smith',
      carModel: 'Tesla Model 3',
      serviceType: 'Premium Wash',
      time: '10:30 AM',
      date: 'Today',
      status: 'Pending',
      price: '$25',
    },
    {
      id: '2',
      customerName: 'Sarah Johnson',
      carModel: 'Honda Civic',
      serviceType: 'Standard Wash',
      time: '11:00 AM',
      date: 'Today',
      status: 'In Progress',
      price: '$20',
    },
    {
      id: '3',
      customerName: 'Mike Wilson',
      carModel: 'BMW X5',
      serviceType: 'Premium Wash',
      time: '2:00 PM',
      date: 'Today',
      status: 'Completed',
      price: '$30',
    },
    {
      id: '4',
      customerName: 'Emily Davis',
      carModel: 'Toyota Camry',
      serviceType: 'Standard Wash',
      time: '9:00 AM',
      date: 'Yesterday',
      status: 'Completed',
      price: '$20',
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Activity</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Activities List */}
        <View style={styles.activitiesList}>
          {activities.map((activity) => {
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
                  <Text style={styles.activityServiceType}>
                    {activity.serviceType}
                  </Text>
                  <View style={styles.activityTimeContainer}>
                    <Ionicons name="time-outline" size={14} color="#6B7280" />
                    <Text style={styles.activityTime}>
                      {activity.date} • {activity.time}
                    </Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  activitiesList: {
    gap: 16,
  },
  activityCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    marginBottom: 4,
  },
  activityServiceType: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
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

export default OwnerActivityScreen;

