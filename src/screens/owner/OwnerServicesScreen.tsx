import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { TEXT_STYLES, FONTS, FONT_SIZES } from '../../utils/fonts';
import { moderateScale } from '../../utils/responsive';
import authService from '../../services/authService';

const BLUE_COLOR = '#0358a8';
const GREEN_ACTIVE = '#059669';
const GRAY_INACTIVE = '#6B7280';

interface OwnerServicesScreenProps {
  onBack?: () => void;
  onLogout?: () => void;
  onSessionExpired?: () => void;
}

type ServiceEdit = {
  id: string | number;
  service_centre_id: string | number;
  name: string;
  description: string;
  price: string;
  offer_price: string;
  status: 'active' | 'inactive';
  display_order?: number;
  _original?: { price: string; offer_price: string; status: 'active' | 'inactive' };
};

const OwnerServicesScreen: React.FC<OwnerServicesScreenProps> = ({ onBack, onLogout, onSessionExpired }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [services, setServices] = useState<ServiceEdit[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const inputRefs = useRef<Record<string, TextInput | null>>({});
  const lastFocusedKey = useRef<string | null>(null);

  const loadServices = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.getOwnerServices(forceRefresh);
      if (!result.success) {
        setError(result.error || 'Failed to load services');
        setServices([]);
        return;
      }
      const rawList = result.services || [];
      const centreFromResult = result.center?.id ?? result.center?.service_centre_id;
      const centreFromFirst = rawList[0]?.service_centre_id ?? rawList[0]?.service_center_id;
      const centreId = centreFromResult ?? centreFromFirst;
      const list = rawList.map((s: any) => {
        const price = s.price != null ? String(s.price) : '';
        const offerPrice = s.offer_price != null ? String(s.offer_price) : '';
        const statusStr = (s.status ?? s.is_active ?? '').toString().toLowerCase();
        const status: 'active' | 'inactive' =
          statusStr === 'inactive' || s.is_active === 0 || s.is_active === false ? 'inactive' : 'active';
        const serviceCentreId = s.service_centre_id ?? centreId ?? s.service_center_id ?? centreFromFirst;
        return {
          id: s.id,
          service_centre_id: serviceCentreId ?? centreId ?? 0,
          name: s.name || s.service_name || 'Service',
          description: s.description != null ? String(s.description).trim() : '',
          price,
          offer_price: offerPrice,
          status,
          display_order: s.display_order,
          _original: { price, offer_price: offerPrice, status },
        };
      });
      setServices(list);
    } catch (e: any) {
      setError(e.message || 'Failed to load services');
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const updateLocalService = (id: string | number, updates: Partial<ServiceEdit>) => {
    setServices((prev) =>
      prev.map((s) => (String(s.id) === String(id) ? { ...s, ...updates } : s))
    );
  };

  const saveService = async (item: ServiceEdit) => {
    const orig = item._original;
    if (!orig) return;
    const priceChanged = item.price !== orig.price;
    const offerChanged = item.offer_price !== orig.offer_price;
    const statusChanged = item.status !== orig.status;
    if (!priceChanged && !offerChanged && !statusChanged) return;

    const serviceCentreId = item.service_centre_id
      || (services.length > 0 && services[0].service_centre_id)
      || 0;
    const validCentreId = Number(serviceCentreId);
    if (!validCentreId || Number.isNaN(validCentreId)) {
      Alert.alert('Error', 'Service centre not found. Please refresh the list and try again.');
      return;
    }

    if (priceChanged || offerChanged) {
      const currentNum = parseFloat(String(item.price).trim());
      const offerStr = String(item.offer_price ?? '').trim();
      const offerNum = offerStr !== '' ? parseFloat(offerStr) : NaN;
      if (!Number.isNaN(offerNum) && !Number.isNaN(currentNum) && offerNum > currentNum) {
        Alert.alert('Invalid price', 'Offer price cannot be greater than current price.');
        return;
      }
    }

    setSavingId(item.id);
    try {
      const payload: { price?: string; offer_price?: string; status?: 'active' | 'inactive'; display_order?: number } = {};
      if (priceChanged || offerChanged) {
        payload.price = item.price !== '' ? item.price : undefined;
        payload.offer_price = item.offer_price;
      }
      if (statusChanged) payload.status = item.status;
      if (item.display_order != null) payload.display_order = item.display_order;

      const result = await authService.updateOwnerService(item.id, validCentreId, payload);
      if (result.success) {
        updateLocalService(item.id, { _original: { price: item.price, offer_price: item.offer_price, status: item.status } });
        setEditingId(null);
        const key = lastFocusedKey.current;
        if (key && inputRefs.current[key]) {
          setTimeout(() => inputRefs.current[key]?.focus(), 100);
        }
      } else {
        const msg = result.error || 'Could not update service. Please try again.';
        const isSessionExpired = result.isAuthError || /session\s*expired|login\s*again|unauthorized|401/i.test(msg);
        if (isSessionExpired && (onSessionExpired || onLogout)) {
          Alert.alert(
            'Session expired',
            'Please login again to continue.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Retry', onPress: () => saveService(item) },
              {
                text: 'Login again',
                onPress: () => {
                  onSessionExpired ? onSessionExpired() : onLogout?.();
                },
              },
            ]
          );
        } else {
          const isTimeout = /timeout|taking too long/i.test(msg);
          if (isTimeout) {
            Alert.alert(
              'Update failed',
              msg,
              [
                { text: 'OK', style: 'cancel' },
                { text: 'Retry', onPress: () => saveService(item) },
              ]
            );
          } else {
            Alert.alert('Update failed', msg);
          }
        }
      }
    } catch (e: any) {
      const msg = e?.message || 'Something went wrong.';
      const isSessionExpired = /session\s*expired|unauthorized|401/i.test(msg);
      const isTimeout = /timeout|taking too long/i.test(msg);
      if (isSessionExpired && (onSessionExpired || onLogout)) {
        Alert.alert(
          'Session expired',
          'Please login again to continue.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry', onPress: () => saveService(item) },
            {
              text: 'Login again',
              onPress: () => {
                onSessionExpired ? onSessionExpired() : onLogout?.();
              },
            },
          ]
        );
      } else if (isTimeout) {
        Alert.alert(
          'Update failed',
          msg,
          [
            { text: 'OK', style: 'cancel' },
            { text: 'Retry', onPress: () => saveService(item) },
          ]
        );
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setSavingId(null);
    }
  };

  const hasChanges = (item: ServiceEdit) => {
    const o = item._original;
    if (!o) return false;
    return item.price !== o.price || item.offer_price !== o.offer_price || item.status !== o.status;
  };

  const scrollBottomPadding = Math.max(insets.bottom + 80, 100);
  const activeCount = services.filter((s) => s.status === 'active').length;

  return (
    <View style={[styles.container, { backgroundColor: BLUE_COLOR }]}>
      <View style={[styles.safeHeader, { paddingTop: insets.top + moderateScale(12) }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.headerBackCircle} onPress={onBack} disabled={!onBack} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{activeCount} Active Service{activeCount !== 1 ? 's' : ''}</Text>
          </View>
        </View>
        <Text style={styles.heroTitle}>Services & Pricing</Text>
        <Text style={styles.heroSubtitle}>Manage your service offerings</Text>
      </View>
      <View style={styles.contentWrap}>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          bounces={true}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={BLUE_COLOR} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading services...</Text>
            </View>
          ) : error ? (
            <View style={styles.loadingBox}>
              <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => loadServices(true)} activeOpacity={0.8}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : services.length === 0 ? (
            <View style={styles.loadingBox}>
              <Ionicons name="pricetags-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No services added yet.</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Add services from your business profile or dashboard.</Text>
            </View>
          ) : (
            <>
              {services.map((item, index) => {
                const priceNum = parseFloat(item.price) || 0;
                const offerNum = parseFloat(item.offer_price) || 0;
                const savings = item.offer_price && priceNum > offerNum ? priceNum - offerNum : 0;
                const iconName = (index % 3 === 0) ? 'sparkles' : (index % 3 === 1) ? 'water-outline' : 'car-outline';
                return (
                <View
                  key={`${item.id}-${index}`}
                  style={[styles.card, styles.cardShadow, { backgroundColor: colors.card }]}
                >
                  <View style={styles.cardInner}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardIconCircle}>
                        <Ionicons name={iconName as any} size={24} color="#FFFFFF" />
                      </View>
                      <View style={styles.serviceNameBlock}>
                        <View style={styles.serviceNameRow}>
                          <Text style={[styles.serviceName, { color: colors.text }]}>{item.name}</Text>
                          <View style={[
                            styles.statusPill,
                            { backgroundColor: item.status === 'active' ? GREEN_ACTIVE + '22' : GRAY_INACTIVE + '22' },
                          ]}>
                            <Text style={[
                              styles.statusPillText,
                              { color: item.status === 'active' ? GREEN_ACTIVE : GRAY_INACTIVE },
                            ]}>
                              {item.status === 'active' ? 'Active' : 'Inactive'}
                            </Text>
                          </View>
                        </View>
                        {item.description ? (
                          <Text style={[styles.serviceDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                            {item.description}
                          </Text>
                        ) : null}
                      </View>
                      <Switch
                        value={item.status === 'active'}
                        onValueChange={(v) => updateLocalService(item.id, { status: v ? 'active' : 'inactive' })}
                        trackColor={{ false: '#E5E7EB', true: BLUE_COLOR + '99' }}
                        thumbColor={item.status === 'active' ? '#FFFFFF' : '#9CA3AF'}
                      />
                    </View>
                    {editingId === item.id ? (
                      <>
                        <View style={[styles.editSection, { borderTopColor: colors.border }]}>
                          <View style={styles.priceRow}>
                            <View style={styles.priceFieldWrap}>
                              <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Current Price (£)</Text>
                              <TextInput
                                ref={(r) => { inputRefs.current[`${item.id}-price`] = r; }}
                                style={[styles.priceInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                value={item.price}
                                onChangeText={(t) => updateLocalService(item.id, { price: t.replace(/[^0-9.]/g, '') })}
                                placeholder="0.00"
                                placeholderTextColor={colors.textSecondary}
                                keyboardType="decimal-pad"
                                onFocus={() => { lastFocusedKey.current = `${item.id}-price`; }}
                              />
                            </View>
                            <View style={styles.priceFieldWrap}>
                              <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Offer Price (£)</Text>
                              <TextInput
                                ref={(r) => { inputRefs.current[`${item.id}-offer`] = r; }}
                                style={[styles.priceInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                value={item.offer_price}
                                onChangeText={(t) => updateLocalService(item.id, { offer_price: t.replace(/[^0-9.]/g, '') })}
                                placeholder="Optional"
                                placeholderTextColor={colors.textSecondary}
                                keyboardType="decimal-pad"
                                onFocus={() => { lastFocusedKey.current = `${item.id}-offer`; }}
                              />
                            </View>
                          </View>
                          {(() => {
                            const curr = parseFloat(String(item.price).trim());
                            const offStr = String(item.offer_price ?? '').trim();
                            const off = offStr !== '' ? parseFloat(offStr) : NaN;
                            const invalid = !Number.isNaN(off) && !Number.isNaN(curr) && off > curr;
                            return invalid ? (
                              <Text style={styles.priceErrorText}>Offer price cannot be greater than current price.</Text>
                            ) : null;
                          })()}
                        </View>
                        <View style={styles.saveCancelRow}>
                          <TouchableOpacity
                            style={[styles.cancelBtn, { borderColor: colors.border }]}
                            onPress={() => {
                              const o = item._original;
                              if (o) updateLocalService(item.id, { price: o.price, offer_price: o.offer_price, status: o.status });
                              setEditingId(null);
                            }}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.saveBtn, styles.saveBtnShadow, { backgroundColor: BLUE_COLOR }]}
                            onPress={() => saveService(item)}
                            disabled={savingId !== null || (() => {
                              const curr = parseFloat(String(item.price).trim());
                              const offStr = String(item.offer_price ?? '').trim();
                              const off = offStr !== '' ? parseFloat(offStr) : NaN;
                              return !Number.isNaN(off) && !Number.isNaN(curr) && off > curr;
                            })()}
                            activeOpacity={0.85}
                          >
                            {savingId === item.id ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <>
                                <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" style={styles.saveBtnIcon} />
                                <Text style={styles.saveBtnText}>Save Changes</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      </>
                    ) : (
                      <>
                        <View style={[styles.priceSummaryRow, { backgroundColor: colors.background }]}>
                          <View style={[styles.priceSummary, styles.priceSummaryInline]}>
                            <View style={styles.priceSummaryItem}>
                              <Text style={[styles.priceSummaryLabel, { color: colors.textSecondary }]}>Current Price</Text>
                              <Text style={[styles.priceSummaryValue, { color: colors.text }]}>£{item.price || '0.00'}</Text>
                            </View>
                            <View style={[styles.priceSummaryDivider, { backgroundColor: colors.border }]} />
                            <View style={styles.priceSummaryItem}>
                              <Text style={[styles.priceSummaryLabel, { color: colors.textSecondary }]}>Offer Price</Text>
                              <Text style={[styles.priceSummaryValue, { color: BLUE_COLOR }]}>
                                {item.offer_price ? `£${item.offer_price}` : '—'}
                              </Text>
                            </View>
                          </View>
                          <TouchableOpacity
                            style={styles.editPenButton}
                            onPress={() => setEditingId(item.id)}
                            activeOpacity={0.85}
                          >
                            <Ionicons name="pencil" size={22} color="#1F2937" />
                          </TouchableOpacity>
                        </View>
                        {savings > 0 ? (
                          <View style={styles.savingsBadge}>
                            <Ionicons name="pricetag" size={14} color={GREEN_ACTIVE} style={styles.savingsIcon} />
                            <Text style={styles.savingsText}>Save £{savings.toFixed(2)}</Text>
                          </View>
                        ) : null}
                      </>
                    )}
                  </View>
                </View>
                );
              })}
            </>
          )}
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
      </View>
    </View>
  );
};

const HEADER_BLUE = '#0358a8';
const LIGHT_GREY_BG = '#F3F4F6';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: HEADER_BLUE },
  safeHeader: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(20),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(16),
  },
  headerBackCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(20),
  },
  headerBadgeText: {
    ...TEXT_STYLES.label,
    color: '#FFFFFF',
  },
  heroTitle: {
    ...TEXT_STYLES.screenTitle,
    color: '#FFFFFF',
    marginBottom: moderateScale(4),
  },
  heroSubtitle: {
    ...TEXT_STYLES.bodySecondary,
    color: 'rgba(255,255,255,0.85)',
  },
  contentWrap: {
    flex: 1,
    backgroundColor: LIGHT_GREY_BG,
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    overflow: 'hidden',
  },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1, backgroundColor: LIGHT_GREY_BG },
  scrollContent: {
    padding: moderateScale(18),
    paddingTop: moderateScale(22),
    flexGrow: 1,
    backgroundColor: LIGHT_GREY_BG,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(48),
  },
  loadingText: {
    ...TEXT_STYLES.bodyPrimary,
    marginTop: moderateScale(12),
  },
  errorText: {
    ...TEXT_STYLES.bodyPrimary,
    marginTop: moderateScale(12),
    textAlign: 'center',
  },
  emptyText: {
    ...TEXT_STYLES.sectionHeadingMedium,
    marginTop: moderateScale(12),
  },
  emptySubtext: {
    ...TEXT_STYLES.bodySecondary,
    marginTop: moderateScale(8),
    textAlign: 'center',
  },
  retryButton: {
    marginTop: moderateScale(16),
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(12),
    backgroundColor: BLUE_COLOR,
    borderRadius: moderateScale(12),
  },
  retryButtonText: {
    ...TEXT_STYLES.buttonProduction,
    color: '#FFFFFF',
  },
  card: {
    borderRadius: moderateScale(16),
    marginBottom: moderateScale(16),
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardInner: {
    padding: moderateScale(18),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: moderateScale(14),
  },
  cardIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BLUE_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(14),
  },
  serviceNameBlock: {
    flex: 1,
    minWidth: 0,
    marginRight: moderateScale(10),
  },
  serviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: moderateScale(8),
    marginBottom: moderateScale(4),
  },
  serviceName: {
    ...TEXT_STYLES.cardTitleSemiBold,
  },
  serviceDescription: {
    ...TEXT_STYLES.bodySecondary,
    opacity: 0.88,
  },
  statusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  statusPill: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(8),
  },
  statusPillText: {
    ...TEXT_STYLES.captionLarge,
  },
  priceSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(14),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(10),
  },
  priceSummary: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(14),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(10),
  },
  priceSummaryInline: {
    flex: 1,
    backgroundColor: 'transparent',
    marginBottom: 0,
    paddingVertical: 0,
  },
  priceSummaryItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceSummaryDivider: {
    width: 1,
    marginVertical: 4,
  },
  priceSummaryLabel: {
    ...TEXT_STYLES.label,
    marginBottom: 4,
  },
  priceSummaryValue: {
    ...TEXT_STYLES.cardTitleSemiBold,
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: GREEN_ACTIVE + '18',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(14),
  },
  savingsIcon: {
    marginRight: moderateScale(4),
  },
  savingsText: {
    ...TEXT_STYLES.captionLarge,
    fontFamily: FONTS.INTER_SEMIBOLD,
    fontWeight: '600' as const,
    color: GREEN_ACTIVE,
  },
  editPenButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F4C901',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: moderateScale(12),
  },
  editSection: {
    paddingTop: moderateScale(16),
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  editLabel: {
    ...TEXT_STYLES.label,
    marginBottom: moderateScale(10),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: 'row',
    gap: moderateScale(16),
  },
  priceFieldWrap: {
    flex: 1,
  },
  priceLabel: {
    ...TEXT_STYLES.label,
    marginBottom: moderateScale(6),
  },
  priceInput: {
    ...TEXT_STYLES.input,
    fontSize: FONT_SIZES.INPUT_LARGE,
    lineHeight: Math.round(FONT_SIZES.INPUT_LARGE * 1.5),
    borderWidth: 1,
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(13),
  },
  priceErrorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: moderateScale(8),
  },
  saveCancelRow: {
    flexDirection: 'row',
    gap: moderateScale(12),
    marginTop: moderateScale(14),
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    ...TEXT_STYLES.buttonProduction,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(10),
  },
  saveBtnShadow: {
    shadowColor: BLUE_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnIcon: {
    marginRight: 0,
  },
  saveBtnText: {
    ...TEXT_STYLES.buttonProduction,
    color: '#FFFFFF',
  },
});

export default OwnerServicesScreen;
