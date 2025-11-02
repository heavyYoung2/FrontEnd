import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '../../src/design/colors';
import { TYPO } from '../../src/design/typography';
import { Ionicons } from '@expo/vector-icons';

export default function CouncilMyPageScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CouncilHeader studentId="C246120" title="나의 회비영" />

      <View style={styles.content}>
        <View style={styles.messageCard}>
          <Text style={[styles.messageText, styles.emphasis]}>
            마이페이지는 학생 화면에서만 보입니다!
          </Text>
          <Text style={[styles.messageText, styles.emphasis, { marginTop: 12 }]}>
            학생 기능을 사용하시려면
          </Text>
          <Text style={[styles.messageText, styles.emphasis, { marginTop: 4 }]}>
            설정 - 학생 화면으로 전환 을 눌러주세요
          </Text>

          <Pressable
            onPress={() => router.push('/settings/switch-role')}
            style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.95 }]}
            hitSlop={10}
          >
            <Text style={styles.actionLabel}>바로 전환하기</Text>
          </Pressable>
        </View>

        <View style={styles.fabColumn}>
          <Pressable
            onPress={() => router.push('/settings/settings-home')}
            style={({ pressed }) => [styles.fabButton, pressed && { opacity: 0.95 }]}
            hitSlop={10}
          >
            <Ionicons name="settings-outline" size={20} color={COLORS.primary} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/settings/guide')}
            style={({ pressed }) => [styles.fabButton, pressed && { opacity: 0.95 }, { marginTop: 12 }]}
            hitSlop={10}
          >
            <Ionicons name="help-circle-outline" size={20} color={COLORS.primary} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.page },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  messageCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  messageText: {
    ...TYPO.body,
    textAlign: 'center',
    color: COLORS.text,
  },
  emphasis: { fontFamily: 'Pretendard-SemiBold' },
  actionButton: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  actionLabel: {
    color: '#FFFFFF',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
  },
  fabColumn: {
    position: 'absolute',
    right: 24,
    top: 500,
    alignItems: 'center',
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
