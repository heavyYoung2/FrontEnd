import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '../../../src/design/colors';
import { TYPO } from '../../../src/design/typography';

const lockerInfo = {
  number: 'A12번',
  statusLabel: '대여중',
  assignedAt: '2025-07-01',
};

const activeRentals = [
  {
    id: 'battery-01',
    name: '보조배터리',
    status: '대여중',
    rentalDate: '2025-07-12',
    dueDate: '2025-07-12',
  },
];

const membershipStatus = {
  paid: true,
  label: '납부',
  checkedAt: '2025-03-10',
};

const warningSummary: { type: 'none' } | { type: 'blacklist'; until: string } = {
  type: 'none',
};

export default function StudentMyPageScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CouncilHeader badgeLabel="학생" studentId="C246120" title="나의 회비영" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>나의 사물함</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.lockerId}>{lockerInfo.number}</Text>
              <View style={[styles.statusPill, styles.statusActive]}>
                <Text style={styles.statusPillText}>{lockerInfo.statusLabel}</Text>
              </View>
            </View>
            <Text style={styles.meta}>배정일 : {lockerInfo.assignedAt}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>나의 대여중인 물품</Text>
            <Pressable
              hitSlop={10}
              onPress={() => router.push('/(student)/rental-history')}
              style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}
            >
              <Text style={styles.linkText}>전체 내역 보기</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
            </Pressable>
          </View>

          <View style={styles.card}>
            {activeRentals.length === 0 ? (
              <Text style={styles.emptyText}>현재 대여중인 물품이 없어요.</Text>
            ) : (
              activeRentals.map((item, index) => (
                <View key={item.id} style={index > 0 ? styles.rentalBlockSpacing : undefined}>
                  <View style={styles.cardRow}>
                    <Text style={styles.rentalName}>{item.name}</Text>
                    <View style={[styles.statusPill, styles.statusActive]}>
                      <Text style={styles.statusPillText}>{item.status}</Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>대여 날짜</Text>
                    <Text style={styles.metaValue}>{item.rentalDate}</Text>
                  </View>
                  <View style={[styles.metaRow, { marginTop: 4 }]}>
                    <Text style={styles.metaLabel}>반납 예정일</Text>
                    <Text style={styles.metaValue}>{item.dueDate}</Text>
                  </View>

                  <Pressable
                    hitSlop={10}
                    onPress={() => router.push('/(student)/return-item')}
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      pressed && styles.pressedSecondary,
                    ]}
                  >
                    <Text style={styles.secondaryButtonText}>반납하기</Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>학생 회비 납부 확인</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.metaLabel}>학생 회비 납부 여부</Text>
              <View style={[styles.statusPill, styles.statusSuccess]}>
                <Text style={styles.statusPillText}>{membershipStatus.label}</Text>
              </View>
            </View>
            <Text style={styles.meta}>마지막 확인일 : {membershipStatus.checkedAt}</Text>

            <Pressable
              hitSlop={10}
              onPress={() => router.push('/(student)/dues-check')}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressedPrimary]}
            >
              <Text style={styles.primaryButtonText}>확인하기</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>챗봇</Text>
          <Pressable
            hitSlop={10}
            onPress={() => router.push('/(student)/chatbot')}
            style={({ pressed }) => [styles.chatButton, pressed && styles.chatButtonPressed]}
          >
            <Text style={styles.chatButtonText}>챗봇과 대화하기</Text>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>경고 누적 조회</Text>
          <View
            style={[
              styles.warningCard,
              warningSummary.type === 'blacklist' ? styles.warningActive : styles.warningSafe,
            ]}
          >
            <Text
              style={[
                styles.warningText,
                warningSummary.type === 'blacklist' ? styles.warningTextActive : styles.warningTextSafe,
              ]}
            >
              {warningSummary.type === 'blacklist'
                ? `블랙리스트 기한 : ${warningSummary.until}`
                : '경고 없음'}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.fabColumn}>
        <Pressable
          hitSlop={10}
          onPress={() => router.push('/(student)/settings')}
          style={({ pressed }) => [styles.fabButton, pressed && { opacity: 0.95 }]}
        >
          <Ionicons name="settings-outline" size={20} color={COLORS.primary} />
        </Pressable>

        <Pressable
          hitSlop={10}
          onPress={() => router.push('/(student)/settings/guide')}
          style={({ pressed }) => [styles.fabButton, pressed && { opacity: 0.95 }]}
        >
          <Ionicons name="help-circle-outline" size={20} color={COLORS.primary} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.page,
  },
  scroll: {
    padding: 24,
    paddingBottom: 120,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...TYPO.subtitle,
    color: COLORS.text,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
    gap: 12,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lockerId: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 20,
    color: COLORS.primary,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPillText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  statusActive: {
    backgroundColor: COLORS.primary,
  },
  statusSuccess: {
    backgroundColor: COLORS.success,
  },
  meta: {
    ...TYPO.bodySm,
    color: COLORS.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 14,
    color: COLORS.text,
  },
  metaValue: {
    fontFamily: 'Pretendard-Regular',
    fontSize: 14,
    color: COLORS.text,
  },
  rentalBlockSpacing: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  rentalName: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 16,
    color: COLORS.text,
  },
  emptyText: {
    ...TYPO.bodySm,
    textAlign: 'center',
    paddingVertical: 16,
    color: COLORS.textMuted,
  },
  secondaryButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
    color: COLORS.primary,
  },
  primaryButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  primaryButtonText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.7,
  },
  pressedPrimary: {
    opacity: 0.85,
  },
  pressedSecondary: {
    backgroundColor: COLORS.blue100,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
    color: COLORS.primary,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary,
  },
  chatButtonPressed: {
    opacity: 0.9,
  },
  chatButtonText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  warningCard: {
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningSafe: {
    backgroundColor: COLORS.blue100,
  },
  warningActive: {
    backgroundColor: '#FFE5E7',
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  warningText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 16,
  },
  warningTextSafe: {
    color: COLORS.primary,
  },
  warningTextActive: {
    color: COLORS.danger,
  },
  fabColumn: {
    position: 'absolute',
    right: 24,
    bottom: 120,
    alignItems: 'center',
    gap: 12,
  },
  fabButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
});
