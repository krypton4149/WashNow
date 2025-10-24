import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface Props {
  onBack?: () => void;
  onNotificationPress?: (notification: Notification) => void;
}

interface Notification {
  id: string;
  type: 'booking-confirmed' | 'service-starting' | 'service-completed' | 'special-offer' | 'booking-canceled';
  title: string;
  description: string;
  timestamp: string;
  isUnread: boolean;
}

const NotificationsScreen: React.FC<Props> = ({ onBack, onNotificationPress }) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'booking-confirmed',
      title: 'Booking Confirmed',
      description: 'Your car wash has been scheduled for Oct 6 at 10:00 AM',
      timestamp: '2 hours ago',
      isUnread: true,
    },
    {
      id: '2',
      type: 'service-starting',
      title: 'Service Starting Soon',
      description: 'Your service will begin in 30 minutes at Premium Auto Wash',
      timestamp: '5 hours ago',
      isUnread: true,
    },
    {
      id: '3',
      type: 'service-completed',
      title: 'Service Completed',
      description: 'Your car wash is complete! Please rate your experience',
      timestamp: '1 day ago',
      isUnread: false,
    },
    {
      id: '4',
      type: 'special-offer',
      title: 'Special Offer',
      description: 'Get 20% off on your next premium wash service!',
      timestamp: '2 days ago',
      isUnread: false,
    },
    {
      id: '5',
      type: 'booking-canceled',
      title: 'Booking Canceled',
      description: 'Your booking for Sep 15 has been canceled. Refund processed.',
      timestamp: '1 week ago',
      isUnread: false,
    },
  ]);

  const unreadCount = notifications.filter(n => n.isUnread).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isUnread: false })));
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isUnread: false } : n
    ));
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'booking-confirmed':
        return { name: 'checkmark', color: '#10B981' };
      case 'service-starting':
        return { name: 'time', color: '#3B82F6' };
      case 'service-completed':
        return { name: 'checkmark', color: '#10B981' };
      case 'special-offer':
        return { name: 'gift', color: '#8B5CF6' };
      case 'booking-canceled':
        return { name: 'close', color: '#EF4444' };
      default:
        return { name: 'notifications', color: '#6B7280' };
    }
  };

  const renderNotification = (notification: Notification) => {
    const icon = getNotificationIcon(notification.type);
    
    return (
      <TouchableOpacity
        key={notification.id}
        style={[
          styles.notificationItem,
          notification.isUnread && styles.unreadNotification
        ]}
        onPress={() => {
          markAsRead(notification.id);
          onNotificationPress?.(notification);
        }}
      >
        <View style={styles.notificationContent}>
          <View style={[styles.notificationIcon, { backgroundColor: icon.color }]}>
            <Ionicons name={icon.name} size={20} color="#FFFFFF" />
          </View>
          <View style={styles.notificationText}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            <Text style={styles.notificationDescription}>{notification.description}</Text>
            <Text style={styles.notificationTimestamp}>{notification.timestamp}</Text>
          </View>
          {notification.isUnread && <View style={styles.unreadDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.unreadCount}>{unreadCount} unread notifications</Text>
        </View>
        <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {notifications.length > 0 ? (
          notifications.map(renderNotification)
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyDescription}>
              You're all caught up! New notifications will appear here.
            </Text>
          </View>
        )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  unreadCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  markAllButton: {
    padding: 4,
  },
  markAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  notificationItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  unreadNotification: {
    backgroundColor: '#F8FAFC',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationTimestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default NotificationsScreen;

