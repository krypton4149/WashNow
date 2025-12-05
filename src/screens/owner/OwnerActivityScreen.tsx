import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import authService from '../../services/authService';
import { FONTS, FONT_SIZES } from '../../utils/fonts';

const BLUE_COLOR = '#0358a8';
const YELLOW_COLOR = '#f4c901';
const LIGHT_BLUE_BG = '#E3F2FD';

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
  isRead?: boolean;
  rawAlert?: any;
}

const OwnerActivityScreen: React.FC<OwnerActivityScreenProps> = ({
  onBack,
}) => {
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<ActivityNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Format time ago from date string
  const formatTimeAgo = (dateString: string | null): string => {
    if (!dateString) return 'Recently';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      return 'Recently';
    }
  };

  // Map API alert type to tone
  const mapTypeToTone = (type: string): Tone => {
    switch (type?.toLowerCase()) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'danger':
      case 'error':
        return 'danger';
      case 'promo':
      case 'promotion':
        return 'promo';
      default:
        return 'info';
    }
  };

  // Map API alert type to icon
  const mapTypeToIcon = (type: string, title: string): string => {
    const lowerTitle = title?.toLowerCase() || '';
    const lowerType = type?.toLowerCase() || '';
    
    if (lowerTitle.includes('confirm') || lowerTitle.includes('complete')) {
      return 'checkmark-circle';
    }
    if (lowerTitle.includes('cancel')) {
      return 'close-circle';
    }
    if (lowerTitle.includes('offer') || lowerTitle.includes('promo')) {
      return 'gift';
    }
    if (lowerTitle.includes('start') || lowerTitle.includes('begin')) {
      return 'time';
    }
    
    switch (lowerType) {
      case 'success':
        return 'checkmark-circle';
      case 'warning':
        return 'warning';
      case 'danger':
      case 'error':
        return 'close-circle';
      case 'promo':
        return 'gift';
      default:
        return 'information-circle';
    }
  };

  // Load alerts from API
  const loadAlerts = async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      console.log('[OwnerActivityScreen] Loading alerts, isRefresh:', isRefresh);
      const result = await authService.getOwnerAlerts(isRefresh);
      
      console.log('[OwnerActivityScreen] API result:', JSON.stringify(result, null, 2));
      console.log('[OwnerActivityScreen] result.success:', result.success);
      console.log('[OwnerActivityScreen] result.alerts:', result.alerts);
      console.log('[OwnerActivityScreen] result.alerts length:', result.alerts?.length);
      console.log('[OwnerActivityScreen] result.alerts is array:', Array.isArray(result.alerts));
      
      if (result.success && Array.isArray(result.alerts)) {
        console.log('[OwnerActivityScreen] Mapping alerts to notifications...');
        // Map API alerts to component format
        const mappedNotifications: ActivityNotification[] = result.alerts.map((alert: any) => {
          console.log('[OwnerActivityScreen] Mapping alert:', alert);
          return {
            id: alert.id?.toString() || '',
            title: alert.title || 'Notification',
            message: alert.message || '',
            timeAgo: formatTimeAgo(alert.updated_at),
            tone: mapTypeToTone(alert.type),
            icon: mapTypeToIcon(alert.type, alert.title),
            highlight: alert.is_read === 0, // Unread alerts are highlighted
            isRead: alert.is_read === 1,
            rawAlert: alert, // Store raw data for mark as read
          };
        });

        console.log('[OwnerActivityScreen] Mapped notifications:', mappedNotifications.length);
        setNotifications(mappedNotifications);
        
        // Count unread notifications
        const unread = mappedNotifications.filter(n => !n.isRead).length;
        setUnreadCount(unread);
        console.log('[OwnerActivityScreen] Unread count:', unread);
      } else {
        console.log('[OwnerActivityScreen] Failed to load alerts. Error:', result.error);
        setError(result.error || 'Failed to load notifications');
        setNotifications([]);
      }
    } catch (err: any) {
      console.error('[OwnerActivityScreen] Load alerts error:', err);
      setError(err.message || 'Failed to load notifications');
      setNotifications([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load alerts on mount
  useEffect(() => {
    loadAlerts();
  }, []);

  // Handle mark as read
  const handleMarkAsRead = async (notification: ActivityNotification) => {
    if (notification.isRead) return;

    try {
      const alertId = notification.rawAlert?.id || notification.id;
      const result = await authService.markOwnerAlertAsRead(alertId);

      if (result.success) {
        // Update local state
        setNotifications(prev => prev.map(n => 
          n.id === notification.id 
            ? { ...n, isRead: true, highlight: false }
            : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        Alert.alert('Error', result.error || 'Failed to mark notification as read');
      }
    } catch (err: any) {
      console.error('[OwnerActivityScreen] Mark as read error:', err);
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const result = await authService.markAllOwnerAlertsAsRead();

      if (result.success) {
        // Update all notifications to read
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true, highlight: false })));
        setUnreadCount(0);
        Alert.alert('Success', 'All notifications marked as read');
      } else {
        Alert.alert('Error', result.error || 'Failed to mark all notifications as read');
      }
    } catch (err: any) {
      console.error('[OwnerActivityScreen] Mark all as read error:', err);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const getToneStyles = (tone: Tone, isUnread?: boolean) => {
    // Icon background: YELLOW_COLOR for unread, BLUE_COLOR for read
    const iconBackground = isUnread ? YELLOW_COLOR : BLUE_COLOR;
    const iconColor = '#FFFFFF';
    
    // Card background: blue for both read and unread (light blue)
    const cardBackground = LIGHT_BLUE_BG;
    
    return {
      container: { backgroundColor: cardBackground },
      iconBackground,
      iconColor,
      dotColor: isUnread ? YELLOW_COLOR : 'transparent', // Yellow dot only for unread
    };
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            {unreadCount} {unreadCount === 1 ? 'unread notification' : 'unread notifications'}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={handleMarkAllAsRead} 
          style={styles.markAllButton}
          disabled={unreadCount === 0}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.markAllReadText,
            { 
              color: unreadCount === 0 ? '#9CA3AF' : BLUE_COLOR,
              opacity: unreadCount === 0 ? 0.5 : 1
            }
          ]}>
            Mark all read
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BLUE_COLOR} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadAlerts()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadAlerts(true)}
              tintColor={BLUE_COLOR}
              colors={[BLUE_COLOR]}
            />
          }
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyText}>No Notifications</Text>
              <Text style={styles.emptySubtext}>
                You're all caught up! New notifications will appear here.
              </Text>
            </View>
          ) : (
            <View style={styles.notificationsList}>
              {notifications.map((item) => {
                const isUnread = !item.isRead;
                const toneStyles = getToneStyles(item.tone, isUnread);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.notificationCard,
                      toneStyles.container,
                    ]}
                    onPress={() => handleMarkAsRead(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.notificationContent}>
                      <View
                        style={[
                          styles.notificationIconWrapper,
                          { backgroundColor: toneStyles.iconBackground },
                        ]}
                      >
                        <Ionicons
                          name={item.icon as any}
                          size={20}
                          color={toneStyles.iconColor}
                        />
                      </View>
                      <View style={styles.notificationTextContainer}>
                        <View style={styles.titleRow}>
                          <Text style={styles.notificationTitle}>{item.title}</Text>
                          {isUnread && (
                            <View
                              style={[
                                styles.notificationDot,
                                { backgroundColor: toneStyles.dotColor },
                              ]}
                            />
                          )}
                        </View>
                        <Text style={styles.notificationMessage}>{item.message}</Text>
                        <Text style={styles.notificationTime}>{item.timeAgo}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </View>
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
    paddingTop: Platform.OS === 'ios' ? 10 : 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.HEADING_MEDIUM,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
    color: '#6B7280',
  },
  markAllButton: {
    padding: 4,
    minWidth: 80,
    alignItems: 'flex-end',
  },
  markAllReadText: {
    fontSize: FONT_SIZES.BUTTON_SMALL,
    fontWeight: '500',
    fontFamily: FONTS.INTER_SEMIBOLD,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: Platform.select({ 
      ios: 80,
      android: 70
    }),
  },
  notificationsList: {
    gap: 12,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  notificationIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationTextContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: FONT_SIZES.BODY_LARGE,
    fontWeight: '700',
    flex: 1,
    marginBottom: 4,
    fontFamily: FONTS.INTER_BOLD,
    color: '#000000',
  },
  notificationMessage: {
    fontSize: FONT_SIZES.BODY_SMALL,
    lineHeight: 20,
    marginBottom: 6,
    fontFamily: FONTS.INTER_REGULAR,
    color: '#6B7280',
  },
  notificationTime: {
    fontSize: FONT_SIZES.CAPTION_SMALL,
    fontFamily: FONTS.INTER_MEDIUM,
    color: '#9CA3AF',
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  errorText: {
    fontSize: FONT_SIZES.BODY_MEDIUM,
    textAlign: 'center',
    paddingHorizontal: 32,
    fontFamily: FONTS.INTER_REGULAR,
    color: '#000000',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 8,
    backgroundColor: BLUE_COLOR,
  },
  retryButtonText: {
    fontSize: FONT_SIZES.BUTTON_MEDIUM,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: FONT_SIZES.HEADING_MEDIUM,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    color: '#6B7280',
  },
  emptySubtext: {
    fontSize: FONT_SIZES.BODY_LARGE,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: FONTS.INTER_REGULAR,
    color: '#6B7280',
  },
});

export default OwnerActivityScreen;
