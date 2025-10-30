import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppHeader from '../../src/components/AppHeader';
import { COLORS } from '../../src/design/colors';
import { TYPO } from '../../src/design/typography';

export default function QrTab() {
  return (
    <View style={styles.screen}>
      <AppHeader role="학생" studentId="C123456" title="QR코드" right={{ icon: 'refresh', onPress: () => {} }} />
      <View style={{ padding: 16 }}>
        <Text style={TYPO.body}>여기에 학생/학생회 QR UI가 붙습니다.</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: COLORS.surface } });
