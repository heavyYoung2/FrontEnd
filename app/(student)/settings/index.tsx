import React from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '../../../src/design/colors';
import { TYPO } from '../../../src/design/typography';

const MENU = [
  { label: '로그아웃', action: 'logout' as const },
  { label: '알림 설정', action: 'notifications' as const },
  { label: '비밀번호 변경하기', action: 'password' as const },
  { label: '회비영 사용법', action: 'guide' as const },
  { label: '학생회 화면 전환', action: 'switch-role' as const },
  { label: '회원 탈퇴하기', action: 'withdraw' as const },
];

export default function StudentSettingsHome() {
  const router = useRouter();

  const handleAction = (action: (typeof MENU)[number]['action']) => {
    switch (action) {
      case 'logout':
        Alert.alert('로그아웃', '정말 로그아웃 하시겠어요?', [
          { text: '취소', style: 'cancel' },
          {
            text: '로그아웃',
            style: 'destructive',
            onPress: () => {
              // TODO: signOut
              router.replace('/auth');
            },
          },
        ]);
        break;
      case 'withdraw':
        Alert.alert('회원 탈퇴', '탈퇴 후 4년간 재가입이 제한됩니다. 진행할까요?', [
          { text: '취소', style: 'cancel' },
          { text: '탈퇴', style: 'destructive', onPress: () => {/* TODO: withdraw */} },
        ]);
        break;
      case 'notifications':
        router.push('/(student)/settings/notifications');
        break;
      case 'password':
        router.push('/(student)/settings/password');
        break;
      case 'guide':
        router.push('/(student)/settings/guide');
        break;
      case 'switch-role':
        router.replace('/(council)/mypage');
        break;
      default:
        break;
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CouncilHeader badgeLabel="학생" studentId="C246120" title="나의 회비영" showBack />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>설정</Text>
      </View>

      <View style={styles.menuCard}>
        {MENU.map((item, index) => (
          <Pressable
            key={item.label}
            onPress={() => handleAction(item.action)}
            style={({ pressed }) => [
              styles.menuRow,
              pressed && { opacity: 0.92 },
              index < MENU.length - 1 && styles.menuDivider,
            ]}
          >
            <Text
              style={[
                styles.menuLabel,
                item.action === 'withdraw' && styles.dangerText,
              ]}
            >
              {item.label}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={item.action === 'withdraw' ? COLORS.danger : '#9AA0A6'}
            />
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.page,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    ...TYPO.subtitle,
    color: COLORS.text,
  },
  menuCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  menuRow: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuDivider: {
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  menuLabel: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 16,
    color: COLORS.text,
  },
  dangerText: {
    color: COLORS.danger,
  },
});
