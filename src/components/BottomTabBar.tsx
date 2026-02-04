import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { FONT_SIZES } from '../utils/fonts';
import { moderateScale, iconScale } from '../utils/responsive';

type TabKey = 'home' | 'bookings' | 'activity' | 'account';

interface BottomTabBarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, onTabChange }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const TabButton = ({ keyId, icon, label }: { keyId: TabKey; icon: string; label: string }) => {
    const isActive = activeTab === keyId;
    const iconName = isActive ? (icon.replace('-outline', '') as any) : (icon as any);
    const color = isActive ? colors.text : colors.textSecondary;
    
    return (
      <TouchableOpacity 
        style={styles.tab} 
        onPress={() => onTabChange(keyId)}
        activeOpacity={0.7}
      >
        <Ionicons name={iconName} size={iconScale(24)} color={color} />
        <Text style={[styles.tabLabel, { color }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const bottomPadding = Math.max(12, Math.min((insets.bottom || 0) + 8, 28));

  return (
    <View style={[styles.tabBarContainer, { backgroundColor: colors.background }]}>
      <View style={[
        styles.tabBar, 
        { 
          paddingBottom: bottomPadding, 
          backgroundColor: colors.background,
          borderTopColor: colors.border || '#E0E0E0'
        }
      ]}>
        <TabButton keyId="home" icon="home-outline" label="Home" />
        <TabButton keyId="bookings" icon="calendar-outline" label="Bookings" />
        <TabButton keyId="activity" icon="notifications-outline" label="Activity" />
        <TabButton keyId="account" icon="person-outline" label="Account" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: moderateScale(8),
    paddingTop: moderateScale(8),
    paddingBottom: moderateScale(16),
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: moderateScale(4),
  },
  tabLabel: {
    fontSize: FONT_SIZES.LABEL,
    marginTop: moderateScale(4),
    fontWeight: '600',
  },
});

export default BottomTabBar;
