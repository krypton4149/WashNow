import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface OwnerActivityScreenProps {
  onBack?: () => void;
}

type Tone = 'success' | 'info' | 'warning' | 'danger' | 'promo';

interface ActivityNotification {
  id: string;
  title: string;
  message: string;
  timeAgo: string;
  tone: Tone;
  icon: string;
  highlight?: boolean;
}

const OwnerActivityScreen: React.FC<OwnerActivityScreenProps> = ({
  onBack,
}) => {
  // Dummy data - in real app, this would come from API
  const notifications = useMemo<ActivityNotification[]>(() => [
    {
      id: '1',
      title: 'Booking Confirmed',
      message: 'Your car wash has been scheduled for Oct 6 at 10:00 AM',
      timeAgo: '2 hours ago',
      tone: 'success',
      icon: 'checkmark-circle',
      highlight: true,
    },
    {
      id: '2',
      title: 'Service Starting Soon',
      message: 'Your service will begin in 30 minutes at Premium Auto Wash',
      timeAgo: '5 hours ago',
      tone: 'info',
      icon: 'time',
      highlight: true,
    },
    {
      id: '3',
      title: 'Service Completed',
      message: 'Your car wash is complete! Please rate your experience',
      timeAgo: '1 day ago',
      tone: 'success',
      icon: 'flash',
    },
    {
      id: '4',
      title: 'Special Offer',
      message: 'Get 20% off on your next premium wash service!',
      timeAgo: '2 days ago',
      tone: 'promo',
      icon: 'gift',
    },
    {
      id: '5',
      title: 'Booking Canceled',
      message: 'Your booking for Sep 15 has been canceled. Refund processed.',
      timeAgo: '3 days ago',
      tone: 'danger',
      icon: 'close-circle',
    },
  ], []);

  const getToneStyles = (tone: Tone, highlight?: boolean) => {
    if (tone === 'success') {
      return {
        container: highlight ? styles.cardSuccessHighlight : styles.cardSuccess,
        iconBackground: '#DCFCE7',
        iconColor: '#16A34A',
        dotColor: highlight ? '#16A34A' : '#22C55E',
      };
    }
    if (tone === 'info') {
      return {
        container: highlight ? styles.cardInfoHighlight : styles.cardInfo,
        iconBackground: '#DBEAFE',
        iconColor: '#2563EB',
        dotColor: highlight ? '#2563EB' : '#3B82F6',
      };
    }
    if (tone === 'danger') {
      return {
        container: styles.cardDanger,
        iconBackground: '#FEE2E2',
        iconColor: '#DC2626',
        dotColor: '#EF4444',
      };
    }
    if (tone === 'warning') {
      return {
        container: styles.cardWarning,
        iconBackground: '#FEF3C7',
        iconColor: '#F59E0B',
        dotColor: '#F59E0B',
      };
    }
    return {
      container: styles.cardPromo,
      iconBackground: '#EDE9FE',
      iconColor: '#7C3AED',
      dotColor: '#7C3AED',
    };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}
        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>2 unread notifications</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.markAllReadText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
      >
        <ImageBackground
          source={{
            uri: 'https://images.unsplash.com/photo-1515923152115-758a6b16b743?auto=format&fit=crop&w=900&q=80',
          }}
          imageStyle={styles.bannerImage}
          style={styles.banner}
        >
          <View style={styles.bannerOverlay} />
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Stay Updated</Text>
            <Text style={styles.bannerSubtitle}>
              Get real-time updates on your bookings
            </Text>
          </View>
        </ImageBackground>

        {/* Notifications List */}
        <View style={styles.notificationsList}>
          {notifications.map((item) => {
            const toneStyles = getToneStyles(item.tone, item.highlight);
            return (
              <View
                key={item.id}
                style={[styles.notificationCard, toneStyles.container]}
              >
                <View style={styles.notificationLeft}>
                  <View
                    style={[
                      styles.notificationIconWrapper,
                      { backgroundColor: toneStyles.iconBackground },
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={22}
                      color={toneStyles.iconColor}
                    />
                  </View>
                  <View style={styles.notificationTextContainer}>
                    <Text style={styles.notificationTitle}>{item.title}</Text>
                    <Text style={styles.notificationMessage}>{item.message}</Text>
                    <Text style={styles.notificationTime}>{item.timeAgo}</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.notificationDot,
                    { backgroundColor: toneStyles.dotColor },
                  ]}
                />
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
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  headerTextGroup: {
    flex: 1,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 14,
    color: '#6B7280',
  },
  markAllReadText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 32,
  },
  banner: {
    height: 120,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 18,
    justifyContent: 'flex-end',
  },
  bannerImage: {
    borderRadius: 20,
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  bannerContent: {
    padding: 18,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#E2E8F0',
    lineHeight: 20,
  },
  notificationsList: {
    gap: 14,
  },
  notificationCard: {
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardSuccess: {
    backgroundColor: '#F6FBF8',
    borderColor: '#BBF7D0',
  },
  cardSuccessHighlight: {
    backgroundColor: '#E8F9EF',
    borderColor: '#4ADE80',
  },
  cardInfo: {
    backgroundColor: '#F3F7FF',
    borderColor: '#BFDBFE',
  },
  cardInfoHighlight: {
    backgroundColor: '#E7F1FF',
    borderColor: '#60A5FA',
  },
  cardWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  cardDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  cardPromo: {
    backgroundColor: '#F6F3FF',
    borderColor: '#DDD6FE',
  },
  notificationLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: 14,
  },
  notificationIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationTextContainer: {
    flex: 1,
    gap: 6,
  },
  notificationTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  notificationMessage: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
  notificationTime: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
  },
  notificationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 16,
    marginTop: 8,
  },
});

export default OwnerActivityScreen;
