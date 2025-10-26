import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppHeader from '../../../src/components/AppHeader';
import { COLORS } from '../../../src/design/colors';
import { TYPO } from '../../../src/design/typography';

export default function LockerTab() {
  return (
    <View style={styles.screen}>
      <AppHeader role="학생회" studentId="C123456" title="사물함" right={{ icon: 'settings-outline', onPress: () => {} }} />
      <View style={{ padding: 16 }}>
        <Text style={TYPO.body}>여기에 사물함 그리드/신청 관리가 붙습니다.</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: COLORS.surface } });
