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

interface OwnerRequestsScreenProps {
  onBack?: () => void;
}

interface BookingRequest {
  id: string;
  customerName: string;
  carModel: string;
  serviceType: string;
  time: string;
  date: string;
  price: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
}

const OwnerRequestsScreen: React.FC<OwnerRequestsScreenProps> = ({
  onBack,
}) => {
  // Dummy data - in real app, this would come from API
  const [requests] = useState<BookingRequest[]>([
    {
      id: '1',
      customerName: 'John Smith',
      carModel: 'Tesla Model 3',
      serviceType: 'Premium Wash',
      time: '10:30 AM',
      date: 'Today',
      price: '$25',
      status: 'Pending',
    },
    {
      id: '2',
      customerName: 'Sarah Johnson',
      carModel: 'Honda Civic',
      serviceType: 'Standard Wash',
      time: '11:00 AM',
      date: 'Today',
      price: '$20',
      status: 'Pending',
    },
    {
      id: '3',
      customerName: 'Mike Wilson',
      carModel: 'BMW X5',
      serviceType: 'Premium Wash',
      time: '2:00 PM',
      date: 'Today',
      price: '$30',
      status: 'Pending',
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return { bg: 'rgba(251, 146, 60, 0.15)', text: '#F97316' };
      case 'Accepted':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981' };
      case 'Rejected':
        return { bg: 'rgba(220, 38, 38, 0.15)', text: '#DC2626' };
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
        <Text style={styles.headerTitle}>Booking Requests</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Requests List */}
        <View style={styles.requestsList}>
          {requests.map((request) => {
            const statusColors = getStatusColor(request.status);
            return (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestLeft}>
                  <Text style={styles.requestCustomerName}>
                    {request.customerName}
                  </Text>
                  <Text style={styles.requestCarModel}>
                    {request.carModel}
                  </Text>
                  <Text style={styles.requestServiceType}>
                    {request.serviceType}
                  </Text>
                  <View style={styles.requestTimeContainer}>
                    <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                    <Text style={styles.requestTime}>
                      {request.date} • {request.time}
                    </Text>
                  </View>
                </View>
                <View style={styles.requestRight}>
                  <View 
                    style={[
                      styles.requestStatusBadge,
                      { backgroundColor: statusColors.bg }
                    ]}
                  >
                    <Text 
                      style={[
                        styles.requestStatusText,
                        { color: statusColors.text }
                      ]}
                    >
                      {request.status}
                    </Text>
                  </View>
                  <Text style={styles.requestPrice}>{request.price}</Text>
                  {request.status === 'Pending' && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.acceptButton]}
                      >
                        <Text style={styles.acceptButtonText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.rejectButton]}
                      >
                        <Text style={styles.rejectButtonText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
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
  requestsList: {
    gap: 16,
  },
  requestCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  requestLeft: {
    flex: 1,
  },
  requestCustomerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  requestCarModel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  requestServiceType: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    marginBottom: 8,
  },
  requestTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  requestTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  requestRight: {
    alignItems: 'flex-end',
  },
  requestStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  requestStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  requestPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#FEE2E2',
  },
  rejectButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default OwnerRequestsScreen;

