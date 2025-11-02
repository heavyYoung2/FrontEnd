import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '../../src/design/colors';
import { TYPO } from '../../src/design/typography';

export default function LockerTab() {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <CouncilHeader
        studentId="C246120"
        title="사물함"
        right={(
          <Pressable onPress={() => {}} hitSlop={10} style={styles.iconBtn}>
            <Ionicons name="settings-outline" size={20} color={COLORS.text} />
          </Pressable>
        )}
      />
      <View style={{ padding: 16 }}>
        <Text style={TYPO.body}>여기에 사물함 그리드/신청 관리가 붙습니다.</Text>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.surface },
  iconBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
});
