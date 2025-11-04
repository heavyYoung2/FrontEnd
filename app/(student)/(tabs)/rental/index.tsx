import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '@/src/design/colors';
import { TYPO } from '@/src/design/typography';
import { useRentalDashboard } from './hooks';

const CARD_GAP = 18;

function parseDateOnly(input: string) {
  const [y, m, d] = input.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function useBlacklistBanner(blacklistUntil: string | null) {
  return React.useMemo(() => {
    if (!blacklistUntil) return { visible: false, label: '' };

    const parsed = parseDateOnly(blacklistUntil);
    if (!parsed) return { visible: false, label: '' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    parsed.setHours(0, 0, 0, 0);

    if (parsed.getTime() > today.getTime()) {
      return { visible: true, label: blacklistUntil };
    }

    return { visible: false, label: '' };
  }, [blacklistUntil]);
}

export default function StudentRentalDashboardScreen() {
  const router = useRouter();
  const { items, blacklistUntil } = useRentalDashboard();
  const blacklist = useBlacklistBanner(blacklistUntil);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CouncilHeader badgeLabel="학생" studentId="C246120" title="대여 물품" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.cardList}>
          {items.map((item) => {
            const total = item.totalCount;
            const available = item.availableCount;
            const rented = Math.max(total - available, 0);
            const availabilityRatio = total === 0 ? 0 : available / total;

            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.description ? <Text style={styles.itemDesc}>{item.description}</Text> : null}
                  </View>
                  <Pressable
                    onPress={() => router.push({ pathname: '/(student)/rent-item', params: { itemId: item.id } })}
                    hitSlop={8}
                    style={({ pressed }) => [styles.chipButton, pressed && styles.chipButtonPressed]}
                  >
                    <Ionicons name="arrow-redo" size={15} color={COLORS.primary} style={{ marginRight: 4 }} />
                    <Text style={styles.chipButtonText}>대여하기</Text>
                  </Pressable>
                </View>

                <View style={styles.statsRow}>
                  <StatPill label="총 수량" value={total} />
                  <StatPill label="대여 가능" value={available} tone="positive" />
                  <StatPill label="대여 중" value={rented} tone="negative" />
                </View>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { flex: availabilityRatio, backgroundColor: COLORS.primary },
                    ]}
                  />
                  <View style={{ flex: 1 - availabilityRatio }} />
                </View>

                <View style={styles.progressLabels}>
                  <Text style={styles.progressLabel}>대여 가능 {available}개</Text>
                  <Text style={styles.progressLabelMuted}>전체 {total}개</Text>
                </View>
              </View>
            );
          })}
        </View>

        {blacklist.visible ? (
          <View style={styles.blacklistCard}>
            <Ionicons name="warning-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.blacklistText}>블랙리스트 기한 : {blacklist.label}</Text>
          </View>
        ) : null}

        <View style={styles.actionPanel}>
          <Pressable
            style={({ pressed }) => [styles.primaryAction, pressed && styles.primaryActionPressed]}
            onPress={() => router.push('/(student)/(tabs)/rental/guides')}
            hitSlop={6}
          >
            <Ionicons name="information-circle" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.primaryActionText}>대여 물품 안내 사항</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryAction, pressed && styles.secondaryActionPressed]}
            onPress={() => router.push('/(student)/(tabs)/rental/my-status')}
            hitSlop={6}
          >
            <Ionicons name="clipboard-outline" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.secondaryActionText}>내 대여 현황 조회하기</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type StatTone = 'default' | 'positive' | 'negative';

function StatPill({ label, value, tone = 'default' }: { label: string; value: number; tone?: StatTone }) {
  const toneColor = tone === 'positive' ? COLORS.primary : tone === 'negative' ? COLORS.danger : COLORS.text;
  return (
    <View style={[styles.statPill, { borderColor: toneColor }]}>
      <Text style={styles.statPillLabel}>{label}</Text>
      <Text style={[styles.statPillValue, { color: toneColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.page,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 120,
    gap: 24,
  },
  cardList: {
    gap: CARD_GAP,
  },
  card: {
    padding: 20,
    borderRadius: 18,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
    gap: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    ...TYPO.subtitle,
    color: COLORS.text,
  },
  itemDesc: {
    ...TYPO.bodySm,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  chipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#EEF2FF',
  },
  chipButtonPressed: {
    opacity: 0.9,
  },
  chipButtonText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 12,
    color: COLORS.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: COLORS.bg,
  },
  statPillLabel: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  statPillValue: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 16,
  },
  progressTrack: {
    height: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 999,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    ...TYPO.caption,
    color: COLORS.text,
  },
  progressLabelMuted: {
    ...TYPO.caption,
    color: COLORS.textMuted,
  },
  blacklistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  blacklistText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  actionPanel: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  primaryAction: {
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionPressed: {
    opacity: 0.92,
  },
  primaryActionText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  secondaryAction: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: '#EEF2FF',
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionPressed: {
    opacity: 0.9,
  },
  secondaryActionText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 15,
    color: COLORS.primary,
  },
});

