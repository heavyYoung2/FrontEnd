import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '../../src/design/colors';
import { TYPO } from '../../src/design/typography';

export default function StudentChatbotScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CouncilHeader badgeLabel="학생" studentId="C246120" title="챗봇" showBack />

      <View style={styles.body}>
        <Text style={styles.placeholder}>챗봇 연동은 추후 업데이트 될 예정입니다.</Text>
        <Text style={styles.caption}>
          FAQ 기반 자동응답과 실시간 상담 흐름이 연결되면 이 화면에서 이용할 수 있어요.
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
