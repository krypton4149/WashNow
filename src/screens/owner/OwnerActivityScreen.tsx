import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { platformEdges } from '../../utils/responsive';
import authService from '../../services/authService';

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

  const getToneStyles = (tone: Tone, highlight?: boolean) => {
    if (tone === 'success') {
      return {
        container: highlight ? styles.cardSuccessHighlight : styles.cardSuccess,
        iconBackground: '#D1FAE5',
        iconColor: '#10B981',
        dotColor: '#2563EB',
      };
    }
    if (tone === 'info') {
      return {
        container: highlight ? styles.cardInfoHighlight : styles.cardInfo,
        iconBackground: '#DBEAFE',
        iconColor: '#2563EB',
        dotColor: '#2563EB',
      };
    }
    if (tone === 'danger') {
      return {
        container: styles.cardDanger,
        iconBackground: '#FEE2E2',
        iconColor: '#DC2626',
        dotColor: '#2563EB',
      };
    }
    if (tone === 'warning') {
      return {
        container: styles.cardWarning,
        iconBackground: '#FEF3C7',
        iconColor: '#F59E0B',
        dotColor: '#2563EB',
      };
    }
    return {
      container: styles.cardPromo,
      iconBackground: '#EDE9FE',
      iconColor: '#7C3AED',
      dotColor: '#2563EB',
    };
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={platformEdges as any}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {onBack ? (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}
        <View style={styles.headerTextGroup}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={[styles.markAllReadText, { color: colors.button }]}>Mark all read</Text>
        </TouchableOpacity>
        )}
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadAlerts(true)}
            tintColor={colors.button}
            colors={[colors.button]}
          />
        }
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
        {isLoading && !isRefreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.button} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading notifications...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.button }]}
              onPress={() => loadAlerts()}
            >
              <Text style={[styles.retryButtonText, { color: colors.buttonText }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>No notifications</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              You're all caught up!
            </Text>
          </View>
        ) : (
        <View style={styles.notificationsList}>
          {notifications.map((item) => {
            const toneStyles = getToneStyles(item.tone, item.highlight);
            return (
                <TouchableOpacity
                key={item.id}
                style={[
                  styles.notificationCard,
                  toneStyles.container,
                  { borderColor: colors.border, backgroundColor: colors.card },
                ]}
                  onPress={() => handleMarkAsRead(item)}
                  activeOpacity={0.7}
              >
                <View style={styles.notificationLeft}>
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
                    <Text style={[styles.notificationTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.notificationMessage, { color: colors.textSecondary }]}>{item.message}</Text>
                    <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>{item.timeAgo}</Text>
                  </View>
                </View>
                {!item.isRead && (
                <View
                  style={[
                    styles.notificationDot,
                      { backgroundColor: '#2563EB' },
                  ]}
                />
                )}
                </TouchableOpacity>
            );
          })}
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
    paddingHorizontal: Platform.select({ ios: 20, android: 18 }),
    paddingTop: Platform.select({ ios: 10, android: 8 }),
    paddingBottom: Platform.select({ ios: 14, android: 12 }),
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
    fontSize: Platform.select({ ios: 20, android: 18 }),
    fontWeight: '600',
    color: '#0F172A',
  },
  headerSubtitle: {
    marginTop: 3,
    fontSize: Platform.select({ ios: 13, android: 12 }),
    color: '#6B7280',
  },
  markAllReadText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2563EB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Platform.select({ ios: 20, android: 18 }),
    paddingTop: Platform.select({ ios: 12, android: 10 }),
    paddingBottom: Platform.select({ 
      ios: 80, // Extra padding for iOS devices (5.4", 6.1", 6.3", 6.4", 6.5", 6.7")
      android: 70 // Extra padding for Android devices (5.4", 5.5", 6.1", 6.3", 6.4", 6.5", 6.7")
    }),
  },
  banner: {
    height: 100,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    justifyContent: 'flex-end',
  },
  bannerImage: {
    borderRadius: 14,
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  bannerContent: {
    padding: 14,
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 18,
  },
  notificationsList: {
    gap: 10,
  },
  notificationCard: {
    borderRadius: Platform.select({ ios: 14, android: 12 }),
    padding: Platform.select({ ios: 16, android: 14 }),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    position: 'relative',
  },
  cardSuccess: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  cardSuccessHighlight: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  cardInfo: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  cardInfoHighlight: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  cardWarning: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  cardDanger: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  cardPromo: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  notificationLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  notificationIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationTextContainer: {
    flex: 1,
    gap: 4,
  },
  notificationTitle: {
    fontSize: Platform.select({ ios: 16, android: 15 }),
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: Platform.select({ ios: 14, android: 13 }),
    color: '#6B7280',
    lineHeight: Platform.select({ ios: 20, android: 18 }),
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  notificationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
    top: 12,
    right: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
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
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default OwnerActivityScreen;
