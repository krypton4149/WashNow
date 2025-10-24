import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface Props {
  onBack?: () => void;
  onViewBookingStatus?: () => void;
  onBackToHome?: () => void;
  acceptedCenter?: any;
}

const PaymentConfirmedScreen: React.FC<Props> = ({ 
  onBack, 
  onViewBookingStatus,
  onBackToHome,
  acceptedCenter = {
    id: '1',
    name: 'Premium Auto Wash',
    rating: 4.8,
    distance: '0.5 mi',
    address: 'Downtown, New York - 123 Main Street',
  }
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Confirmation Icon */}
        <View style={styles.confirmationIcon}>
          <Ionicons name="checkmark" size={48} color="#FFFFFF" />
        </View>
        
        <Text style={styles.confirmationTitle}>Booking Confirmed!</Text>
        <Text style={styles.confirmationSubtitle}>Your car wash has been scheduled</Text>

        {/* Booking Details Card */}
        <View style={styles.bookingCard}>
          <View style={styles.bookingHeader}>
            <Text style={styles.bookingId}>Booking ID: #BK6305</Text>
          </View>
          
          <View style={styles.bookingDetails}>
            {/* Location */}
            <View style={styles.bookingRow}>
              <View style={styles.bookingIcon}>
                <Ionicons name="location" size={16} color="#000" />
              </View>
              <View style={styles.bookingContent}>
                <Text style={styles.bookingLabel}>Location</Text>
                <Text style={styles.bookingValue}>{acceptedCenter.name}</Text>
              </View>
            </View>

            {/* Date */}
            <View style={styles.bookingRow}>
              <View style={styles.bookingIcon}>
                <Ionicons name="calendar" size={16} color="#000" />
              </View>
              <View style={styles.bookingContent}>
                <Text style={styles.bookingLabel}>Date</Text>
                <View style={styles.dateRow}>
                  <Text style={styles.bookingValue}>Oct 24, 2025</Text>
                  <View style={styles.previewTag}>
                    <Text style={styles.previewText}>Preview</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Time */}
            <View style={styles.bookingRow}>
              <View style={styles.bookingIcon}>
                <Ionicons name="time" size={16} color="#000" />
              </View>
              <View style={styles.bookingContent}>
                <Text style={styles.bookingLabel}>Time</Text>
                <Text style={styles.bookingValue}>Now</Text>
              </View>
            </View>
          </View>

          {/* Payment Summary */}
          <View style={styles.paymentSummary}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Payment Status</Text>
              <Text style={styles.paymentStatus}>Paid</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Total Amount</Text>
              <Text style={styles.paymentAmount}>$27.50</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.viewStatusButton} onPress={onViewBookingStatus}>
          <Text style={styles.viewStatusButtonText}>View Booking Status</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.backToHomeButton} onPress={onBackToHome}>
          <Text style={styles.backToHomeButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 60,
    alignItems: 'center',
  },
  confirmationIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  confirmationSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 40,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  bookingId: {
    fontSize: 12,
    color: '#666666',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bookingDetails: {
    marginBottom: 20,
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  bookingIcon: {
    width: 24,
    alignItems: 'center',
    marginTop: 2,
  },
  bookingContent: {
    flex: 1,
    marginLeft: 12,
  },
  bookingLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  bookingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewTag: {
    backgroundColor: '#374151',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  previewText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  paymentSummary: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666666',
  },
  paymentStatus: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  bottomContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  viewStatusButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  viewStatusButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  backToHomeButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  backToHomeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
});

export default PaymentConfirmedScreen;
