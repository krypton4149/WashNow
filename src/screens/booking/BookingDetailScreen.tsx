import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale, platformEdges } from '../../utils/responsive';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface ActivityDetail {
  id: string;
  title: string;
  serviceType: string;
  time: string;
  status: string;
  bookingDate?: string;
  bookingTime?: string;
  vehicleNo?: string;
  bookingCode?: string;
  paymentMethod?: string;
}

interface Props {
  activity: ActivityDetail;
  onBack: () => void;
}

const BookingDetailScreen: React.FC<Props> = ({ activity, onBack }) => {
  return (
    <SafeAreaView style={styles.container} edges={platformEdges as any}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Booking Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{activity.title}</Text>
              <Text style={styles.cardSubtitle}>{activity.serviceType}</Text>
            </View>
            <View style={[styles.statusTag, activity.status === 'Completed' ? styles.statusCompleted : styles.statusProgress]}>
              <Text style={[styles.statusText, activity.status === 'Completed' ? styles.statusTextCompleted : styles.statusTextProgress]}>
                {activity.status}
              </Text>
            </View>
          </View>

          <View style={styles.list}>
            <View style={styles.item}>
              <Ionicons name="calendar-outline" size={18} color="#6B7280" style={styles.rowIcon} />
              <View style={styles.itemTexts}>
                <Text style={styles.itemLabel}>Date & Time</Text>
                <Text style={styles.itemValue}>
                  {activity.bookingDate && activity.bookingTime
                    ? `${new Date(activity.bookingDate).toDateString()} at ${activity.bookingTime}`
                    : activity.time}
                </Text>
              </View>
            </View>
            {activity.vehicleNo ? (
              <View style={styles.item}>
                <Ionicons name="car-outline" size={18} color="#6B7280" style={styles.rowIcon} />
                <View style={styles.itemTexts}>
                  <Text style={styles.itemLabel}>Vehicle</Text>
                  <Text style={styles.itemValue}>{activity.vehicleNo}</Text>
                </View>
              </View>
            ) : null}
            {activity.bookingCode ? (
              <View style={styles.item}>
                <Ionicons name="receipt-outline" size={18} color="#6B7280" style={styles.rowIcon} />
                <View style={styles.itemTexts}>
                  <Text style={styles.itemLabel}>Booking ID</Text>
                  <Text style={styles.itemValue}>{activity.bookingCode}</Text>
                </View>
              </View>
            ) : null}
            {activity.paymentMethod ? (
              <View style={styles.item}>
                <Ionicons name="card-outline" size={18} color="#6B7280" style={styles.rowIcon} />
                <View style={styles.itemTexts}>
                  <Text style={styles.itemLabel}>Notes</Text>
                  <Text style={styles.itemValue}>{activity.paymentMethod}</Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
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
  backButton: { padding: 4 },
  title: { fontSize: moderateScale(18), fontWeight: '600', color: '#000' },
  content: { padding: moderateScale(16) },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: moderateScale(14),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: moderateScale(20), fontWeight: '700', color: '#111827' },
  cardSubtitle: { fontSize: moderateScale(15), color: '#6B7280', marginTop: 2 },
  label: { fontSize: moderateScale(13), color: '#6B7280', marginBottom: 4 },
  value: { fontSize: moderateScale(16), color: '#111827', fontWeight: '600', marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  rowIcon: { marginRight: 10 },
  rowText: { fontSize: moderateScale(15), color: '#4B5563' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  statusTag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  statusCompleted: { backgroundColor: 'rgba(16,185,129,0.15)' },
  statusProgress: { backgroundColor: 'rgba(59,130,246,0.15)' },
  statusText: { fontSize: moderateScale(12), fontWeight: '600' },
  statusTextCompleted: { color: '#10B981' },
  statusTextProgress: { color: '#3B82F6' },
  list: { marginTop: 12 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: moderateScale(10), borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  itemTexts: { flex: 1 },
  itemLabel: { fontSize: moderateScale(12), color: '#9CA3AF' },
  itemValue: { fontSize: moderateScale(15), color: '#111827', marginTop: 2 },
});

export default BookingDetailScreen;


