import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '../../src/design/colors';
import { TYPO } from '../../src/design/typography';

export default function StudentRentalHistoryScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CouncilHeader badgeLabel="학생" studentId="C246120" title="전체 대여 내역" showBack />

      <View style={styles.body}>
        <Text style={styles.placeholder}>전체 대여 내역 화면은 준비 중입니다.</Text>
        <Text style={styles.caption}>추후 실제 내역 데이터를 연결할 예정입니다.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.page,
  },
  body: {
    flex: 1,
    padding: 24,
    gap: 8,
  },
  placeholder: {
    ...TYPO.body,
    color: COLORS.text,
  },
  caption: {
    ...TYPO.bodySm,
  },
});
