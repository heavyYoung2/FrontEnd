import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '../../src/design/colors';
import { TYPO } from '../../src/design/typography';

export default function StudentReturnItemScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CouncilHeader badgeLabel="학생" studentId="C246120" title="대여 물품 반납" showBack />

      <View style={styles.body}>
        <Text style={styles.placeholder}>반납 처리 화면은 곧 제공될 예정입니다.</Text>
        <Text style={styles.caption}>
          QR 스캔 및 관리자 승인 흐름과 연결되면 실제 반납 절차를 안내해요.
        </Text>
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
