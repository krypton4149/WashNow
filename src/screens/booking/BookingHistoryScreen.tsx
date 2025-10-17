import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface Booking {
  id: string;
  name: string;
  type: string;
  date: string;
  time: string;
  status: 'In Progress' | 'Completed' | 'Canceled';
  total: string;
}

interface Props {
  onBack?: () => void;
}

const BookingHistoryScreen: React.FC<Props> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'Ongoing' | 'Completed' | 'Canceled'>('Ongoing');

  const bookings: Booking[] = [
    {
      id: '1',
      name: 'Premium Auto Wash',
      type: 'Full Detailing',
      date: 'Oct 6, 2025',
      time: '10:00 AM',
      status: 'In Progress',
      total: '$50',
    },
    {
      id: '2',
      name: 'Quick Shine Car Care',
      type: 'Exterior Wash',
      date: 'Sep 20, 2025',
      time: '02:00 PM',
      status: 'Completed',
      total: '$30',
    },
    {
      id: '3',
      name: 'Elite Car Spa',
      type: 'Deep Clean',
      date: 'Aug 15, 2025',
      time: '11:00 AM',
      status: 'Completed',
      total: '$75',
    },
    {
      id: '4',
      name: 'Express Auto Detail',
      type: 'Maintenance',
      date: 'Jul 10, 2025',
      time: '09:00 AM',
      status: 'Canceled',
      total: '$40',
    },
  ];

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'Ongoing') return booking.status === 'In Progress';
    if (activeTab === 'Completed') return booking.status === 'Completed';
    if (activeTab === 'Canceled') return booking.status === 'Canceled';
    return true;
  });

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'In Progress':
        return '#DBEAFE'; // Light blue
      case 'Completed':
        return '#D1FAE5'; // Light green
      case 'Canceled':
        return '#FEE2E2'; // Light red
      default:
        return '#E5E7EB';
    }
  };

  const getStatusTextColor = (status: Booking['status']) => {
    switch (status) {
      case 'In Progress':
        return '#2563EB'; // Blue
      case 'Completed':
        return '#059669'; // Green
      case 'Canceled':
        return '#DC2626'; // Red
      default:
        return '#4B5563';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Booking History</Text>
        <View style={{ width: 24 }} /> {/* Placeholder for alignment */}
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Ongoing' && styles.activeTab]}
          onPress={() => setActiveTab('Ongoing')}
        >
          <Text style={[styles.tabText, activeTab === 'Ongoing' && styles.activeTabText]}>
            Ongoing
          </Text>
          {activeTab === 'Ongoing' && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{filteredBookings.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Completed' && styles.activeTab]}
          onPress={() => setActiveTab('Completed')}
        >
          <Text style={[styles.tabText, activeTab === 'Completed' && styles.activeTabText]}>
            Completed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Canceled' && styles.activeTab]}
          onPress={() => setActiveTab('Canceled')}
        >
          <Text style={[styles.tabText, activeTab === 'Canceled' && styles.activeTabText]}>
            Canceled
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.bookingsList} showsVerticalScrollIndicator={false}>
        {filteredBookings.length > 0 ? (
          filteredBookings.map((booking) => (
            <View key={booking.id} style={styles.bookingCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{booking.name}</Text>
                <View
                  style={[
                    styles.statusTag,
                    { backgroundColor: getStatusColor(booking.status) },
                  ]}
                >
                  <Text style={[styles.statusText, { color: getStatusTextColor(booking.status) }]}>
                    {booking.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardSubtitle}>{booking.type}</Text>
              <View style={styles.cardDateTime}>
                <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                <Text style={styles.cardDateTimeText}>
                  {booking.date} at {booking.time}
                </Text>
              </View>
              <View style={styles.cardDivider} />
              <View style={styles.cardFooter}>
                <Text style={styles.cardTotalLabel}>Total</Text>
                <Text style={styles.cardTotalPrice}>{booking.total}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noBookingsContainer}>
            <Ionicons name="information-circle-outline" size={48} color="#CCCCCC" />
            <Text style={styles.noBookingsText}>No {activeTab.toLowerCase()} bookings</Text>
            <Text style={styles.noBookingsSubtext}>Check other tabs or book a new service.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Light gray background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  activeTab: {
    borderBottomColor: '#111827',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#111827',
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bookingsList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  statusTag: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  cardDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardDateTimeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTotalLabel: {
    fontSize: 15,
    color: '#111827',
  },
  cardTotalPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  noBookingsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  noBookingsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
  },
  noBookingsSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
});

export default BookingHistoryScreen;
