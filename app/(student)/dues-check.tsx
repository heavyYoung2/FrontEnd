import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '../../src/design/colors';
import { TYPO } from '../../src/design/typography';

export default function StudentDuesCheckScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CouncilHeader badgeLabel="학생" studentId="C246120" title="회비 납부 확인" showBack />

      <View style={styles.body}>
        <Text style={styles.placeholder}>회비 납부 증빙 화면은 준비 중이에요.</Text>
        <Text style={styles.caption}>
          납부 영수증 업로드 및 상태 확인 기능이 연결되면 이곳에서 확인할 수 있습니다.
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
