import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '../../../src/design/colors';
import { TYPO } from '../../../src/design/typography';

const locker = {
  id: 'A12번',
  location: 'T동 5층 로비',
  available: false,
  note: '현재 배정된 사물함입니다.',
};

export default function StudentLockerScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CouncilHeader badgeLabel="학생" studentId="C246120" title="사물함" />

      <View style={styles.card}>
        <Text style={styles.lockerId}>{locker.id}</Text>
        <Text style={styles.location}>{locker.location}</Text>
        <Text style={styles.note}>{locker.note}</Text>

        <Pressable style={({ pressed }) => [styles.action, pressed && { opacity: 0.85 }]}>
          <Text style={styles.actionText}>배정 변경 요청</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.page,
    padding: 24,
  },
  card: {
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  lockerId: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 24,
    color: COLORS.primary,
  },
  location: {
    ...TYPO.body,
    color: COLORS.text,
  },
  note: {
    ...TYPO.bodySm,
    color: COLORS.textMuted,
  },
  action: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  actionText: {
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.primary,
    fontSize: 14,
  },
});
