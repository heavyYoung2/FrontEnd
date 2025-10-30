import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppHeader from '../../src/components/AppHeader';
import { COLORS } from '../../src/design/colors';
import { TYPO } from '../../src/design/typography';

export default function RentalTab() {
  return (
    <View style={styles.screen}>
      <AppHeader role="학생회" studentId="C123456" title="대여 물품" right={{ icon: 'list', onPress: () => {} }} />
      <View style={{ padding: 16 }}>
        <Text style={TYPO.body}>여기에 대여 물품 홈 UI를 구현합니다.</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: COLORS.surface } });
