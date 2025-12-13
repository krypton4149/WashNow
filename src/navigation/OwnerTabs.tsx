import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import OwnerDashboardScreen from '../screens/owner/OwnerDashboardScreen';
import OwnerRequestsScreen from '../screens/owner/OwnerRequestsScreen';
import OwnerActivityScreen from '../screens/owner/OwnerActivityScreen';
import OwnerAccountScreen from '../screens/owner/OwnerAccountScreen';
import OwnerSettingsScreen from '../screens/owner/OwnerSettingsScreen';
import OwnerSupportScreen from '../screens/owner/OwnerSupportScreen';
import OwnerChangePasswordScreen from '../screens/owner/OwnerChangePasswordScreen';
import { useTheme } from '../context/ThemeContext';

type TabKey = 'home' | 'requests' | 'activity' | 'account';

interface OwnerTabsProps {
  userData: any;
  onLogout?: () => void;
  onViewAllActivity?: () => void;
  onBookingRequestPress?: () => void;
}

const OwnerTabs: React.FC<OwnerTabsProps> = ({
  userData,
  onLogout,
  onViewAllActivity,
  onBookingRequestPress,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [accountSubView, setAccountSubView] = useState<'profile' | 'settings' | 'support' | 'password'>('profile');

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <OwnerDashboardScreen
            onLogout={onLogout}
            onViewAll={() => setActiveTab('requests')}
            onViewAllActivity={() => setActiveTab('activity')}
            onBookingRequestPress={() => setActiveTab('requests')}
            businessName={userData?.businessName || 'Premium Auto Wash'}
          />
        );
      case 'requests':
        return (
          <OwnerRequestsScreen
            onBack={() => setActiveTab('home')}
          />
        );
      case 'activity':
        return (
          <OwnerActivityScreen
            onBack={() => setActiveTab('home')}
          />
        );
      case 'account':
        switch (accountSubView) {
          case 'settings':
            return (
              <OwnerSettingsScreen
                onBack={() => setAccountSubView('profile')}
                onChangePassword={() => setAccountSubView('password')}
              />
            );
          case 'support':
            return (
              <OwnerSupportScreen
                onBack={() => setAccountSubView('profile')}
              />
            );
          case 'password':
            return (
              <OwnerChangePasswordScreen
                onBack={() => setAccountSubView('settings')}
                onPasswordChanged={() => {
                  setAccountSubView('profile');
                }}
                onLogout={onLogout}
              />
            );
          default:
            return (
              <OwnerAccountScreen
                onBack={() => setActiveTab('home')}
                userData={userData}
                onEditProfile={() => console.log('Edit profile')}
                onOpenSettings={() => setAccountSubView('settings')}
                onOpenSupport={() => setAccountSubView('support')}
              />
            );
        }
      default:
        return null;
    }
  };

  const TabButton = ({ keyId, icon, label }: { keyId: TabKey; icon: string; label: string }) => {
    const isActive = activeTab === keyId;
    const iconName = isActive ? (icon.replace('-outline', '') as any) : (icon as any);
    const activeColor = colors.button;
    const inactiveColor = colors.textSecondary;
    const color = isActive ? activeColor : inactiveColor;
    return (
      <TouchableOpacity style={styles.tab} onPress={() => setActiveTab(keyId)}>
        <Ionicons name={iconName} size={24} color={color} />
        <Text style={[styles.tabLabel, { color }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const bottomPadding = Math.max(8, Math.min(insets.bottom || 0, 18));
  
  // For dashboard (home tab) and account tab, don't apply top safe area so blue header can extend to top
  const safeAreaEdges = (activeTab === 'home' || activeTab === 'account') ? ['bottom'] : ['top', 'bottom'];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background || '#FFFFFF' }]}
      edges={safeAreaEdges}
    >
      <View style={styles.content}>{renderContent()}</View>
      <View style={[styles.tabBar, { paddingBottom: bottomPadding, backgroundColor: colors.card || '#FFFFFF', borderTopColor: colors.border || '#E5E7EB' }]}>
        <TabButton keyId="home" icon="home-outline" label="Home" />
        <TabButton keyId="requests" icon="calendar-outline" label="Requests" />
        <TabButton keyId="activity" icon="notifications-outline" label="Activity" />
        <TabButton keyId="account" icon="person-outline" label="Account" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  tab: { alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 12, marginTop: 4, fontWeight: '600' },
});

export default OwnerTabs;


