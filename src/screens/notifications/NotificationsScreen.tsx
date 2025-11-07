import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import authService from '../../services/authService';

interface Props {
  onBack?: () => void;
  onNotificationPress?: (notification: Notification) => void;
}

interface Notification {
  id: string | number;
  type?: 'booking-confirmed' | 'service-starting' | 'service-completed' | 'special-offer' | 'booking-canceled' | string;
  title: string;
  description?: string;
  message?: string;
  timestamp?: string;
  created_at?: string;
  isUnread?: boolean;
  is_read?: boolean;
  read?: boolean;
}

const NotificationsScreen: React.FC<Props> = ({ onBack, onNotificationPress }) => {
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingRead, setMarkingRead] = useState<string | number | null>(null);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const result = await authService.getAlerts();
      
      if (result.success && result.alerts) {
        // Handle different API response structures
        let alertsArray = [];
        
        if (Array.isArray(result.alerts)) {
          alertsArray = result.alerts;
        } else if (result.alerts && Array.isArray(result.alerts.data)) {
          alertsArray = result.alerts.data;
        } else if (Array.isArray(result.data)) {
          alertsArray = result.data;
        } else if (result.data && Array.isArray(result.data.alerts)) {
          alertsArray = result.data.alerts;
        } else if (result.data && Array.isArray(result.data.data)) {
          alertsArray = result.data.data;
        }
        
        console.log('Alerts array from result:', alertsArray);
        console.log('Number of alerts:', alertsArray.length);
        
        // Map API response to notification format
        const mappedNotifications = alertsArray.map((alert: any) => ({
          id: alert.id || alert.alert_id || Math.random().toString(),
          type: alert.type || 'notification',
          title: alert.title || alert.subject || 'Notification',
          description: alert.message || alert.description || alert.body || '',
          message: alert.message || alert.description || alert.body || '',
          timestamp: alert.created_at || alert.updated_at || alert.timestamp || new Date().toISOString(),
          isUnread: !(alert.is_read === 1 || alert.is_read === true || alert.read === true),
          is_read: alert.is_read === 1 || alert.is_read === true || alert.read === true,
        }));
        
        console.log('Mapped notifications:', mappedNotifications);
        setNotifications(mappedNotifications);
      } else {
        // If API returns success but no alerts, show empty state
        console.log('No alerts in response or API returned error:', result);
        setNotifications([]);
        if (result.error) {
          console.log('Error from API:', result.error);
        }
      }
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      // Only show alert if it's a critical error
      if (error.message && !error.message.includes('undefined')) {
        Alert.alert('Error', error.message || 'Failed to load notifications');
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => n.isUnread || !n.is_read).length;

  // Format timestamp to relative time
  const formatTimestamp = (timestamp?: string): string => {
    if (!timestamp) return 'Recently';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      const diffWeeks = Math.floor(diffDays / 7);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
      if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
      if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
      if (diffWeeks < 4) return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
      
      // Format as date if older than 4 weeks
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
    } catch (error) {
      return 'Recently';
    }
  };

  const markAllAsRead = async () => {
    try {
      const result = await authService.markAllAlertsAsRead();
      
      if (result.success) {
        // Update local state
        setNotifications(notifications.map(n => ({ ...n, isUnread: false, is_read: true })));
      } else {
        Alert.alert('Error', result.error || 'Failed to mark all notifications as read');
      }
    } catch (error: any) {
      console.error('Error marking all as read:', error);
      Alert.alert('Error', error.message || 'Failed to mark all notifications as read');
    }
  };

  const markAsRead = async (id: string | number) => {
    try {
      setMarkingRead(id);
      const result = await authService.markAlertAsRead(id);
      
      if (result.success) {
        // Update local state optimistically
        setNotifications(notifications.map(n => 
          n.id === id ? { ...n, isUnread: false, is_read: true } : n
        ));
      } else {
        // Don't show alert if it's just that the alert wasn't found (might already be read)
        if (!result.error?.includes('No query results')) {
          Alert.alert('Error', result.error || 'Failed to mark notification as read');
        } else {
          // Optimistically update UI even if API says alert not found
          setNotifications(notifications.map(n => 
            n.id === id ? { ...n, isUnread: false, is_read: true } : n
          ));
        }
      }
    } catch (error: any) {
      console.error('Error marking as read:', error);
      // Don't show alert for "not found" errors, just update UI
      if (!error.message?.includes('No query results')) {
        Alert.alert('Error', error.message || 'Failed to mark notification as read');
      } else {
        // Optimistically update UI
        setNotifications(notifications.map(n => 
          n.id === id ? { ...n, isUnread: false, is_read: true } : n
        ));
      }
    } finally {
      setMarkingRead(null);
    }
  };

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'booking-confirmed':
      case 'booking_confirmed':
        return { name: 'checkmark-circle' as const, color: '#4CAF50' };
      case 'service-starting':
      case 'service_starting':
        return { name: 'time-outline' as const, color: '#3366FF' };
      case 'service-completed':
      case 'service_completed':
        return { name: 'checkmark-circle' as const, color: '#4CAF50' };
      case 'special-offer':
      case 'special_offer':
        return { name: 'gift-outline' as const, color: '#8B5CF6' };
      case 'booking-canceled':
      case 'booking_canceled':
        return { name: 'close-circle' as const, color: '#DC2626' };
      default:
        return { name: 'notifications-circle' as const, color: '#6B7280' };
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read when clicked (if not already read)
    if (notification.isUnread || !notification.is_read) {
      markAsRead(notification.id);
    }
    onNotificationPress?.(notification);
  };

  const renderNotification = (notification: Notification) => {
    const icon = getNotificationIcon(notification.type);
    const isUnread = notification.isUnread || !notification.is_read;
    const isMarking = markingRead === notification.id;
    
    // Determine icon background color based on read status
    const iconBackgroundColor = isUnread ? '#3366FF' : '#4CAF50';
    
    return (
      <TouchableOpacity
        key={notification.id.toString()}
        style={[
          styles.notificationItem,
          { backgroundColor: colors.card || '#FFFFFF', borderColor: colors.border },
        ]}
        onPress={() => handleNotificationPress(notification)}
        disabled={isMarking}
        activeOpacity={0.7}
      >
        <View style={styles.notificationContent}>
          <View style={[styles.notificationIcon, { backgroundColor: iconBackgroundColor }]}>
            <Ionicons name={icon.name} size={20} color="#FFFFFF" />
          </View>
          <View style={styles.notificationText}>
            <View style={styles.titleRow}>
              <Text style={[styles.notificationTitle, { color: colors.text }]}>{notification.title}</Text>
              {isMarking ? (
                <ActivityIndicator size="small" color={colors.button} style={styles.markingIndicator} />
              ) : (
                isUnread && <View style={[styles.unreadDot, { backgroundColor: '#3366FF' }]} />
              )}
            </View>
            <Text style={[styles.notificationDescription, { color: colors.textSecondary }]}>
              {notification.description || notification.message || ''}
            </Text>
            <Text style={[styles.notificationTimestamp, { color: colors.textSecondary }]}>
              {formatTimestamp(notification.timestamp || notification.created_at)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { backgroundColor: colors.card || colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
          <Text style={[styles.unreadCount, { color: colors.textSecondary }]}>
            {unreadCount} {unreadCount === 1 ? 'unread notification' : 'unread notifications'}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={markAllAsRead} 
          style={styles.markAllButton}
          disabled={unreadCount === 0}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.markAllText, 
            { 
              color: unreadCount === 0 ? colors.textSecondary : colors.button,
              opacity: unreadCount === 0 ? 0.5 : 1
            }
          ]}>
            Mark all read
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.button} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading notifications...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchNotifications}
              tintColor={colors.button}
            />
          }
        >
          {notifications.length > 0 ? (
            <View style={styles.notificationsList}>
              {notifications.map(renderNotification)}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No Notifications</Text>
              <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                You're all caught up! New notifications will appear here.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  unreadCount: {
    fontSize: 14,
  },
  markAllButton: {
    padding: 4,
    minWidth: 80,
    alignItems: 'flex-end',
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  notificationsList: {
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  notificationItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  notificationTimestamp: {
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    marginTop: 4,
  },
  markingIndicator: {
    marginLeft: 8,
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default NotificationsScreen;
